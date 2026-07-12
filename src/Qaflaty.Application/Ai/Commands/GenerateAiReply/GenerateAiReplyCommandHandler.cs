using System.Globalization;
using Microsoft.Extensions.Logging;
using Qaflaty.Application.Ai.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.Interfaces.Ai;
using Qaflaty.Application.Communication.DTOs;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.AiInteraction;
using Qaflaty.Domain.Communication.Aggregates.ChatConversation;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Application.Ai.Commands.GenerateAiReply;

public sealed class GenerateAiReplyCommandHandler : ICommandHandler<GenerateAiReplyCommand, AiReplyDto>
{
    private const string BotSenderId = "ai-assistant";
    private const int MaxHistoryMessages = 20;

    private readonly IChatConversationRepository _conversationRepository;
    private readonly IStoreConfigurationRepository _configRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly IAiEmbeddingService _embeddingService;
    private readonly IAiChatCompletionService _chatService;
    private readonly IVectorStore _vectorStore;
    private readonly IAiInteractionLogRepository _interactionLogRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<GenerateAiReplyCommandHandler> _logger;

    public GenerateAiReplyCommandHandler(
        IChatConversationRepository conversationRepository,
        IStoreConfigurationRepository configRepository,
        IStoreRepository storeRepository,
        IAiEmbeddingService embeddingService,
        IAiChatCompletionService chatService,
        IVectorStore vectorStore,
        IAiInteractionLogRepository interactionLogRepository,
        IUnitOfWork unitOfWork,
        ILogger<GenerateAiReplyCommandHandler> logger)
    {
        _conversationRepository = conversationRepository;
        _configRepository = configRepository;
        _storeRepository = storeRepository;
        _embeddingService = embeddingService;
        _chatService = chatService;
        _vectorStore = vectorStore;
        _interactionLogRepository = interactionLogRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<AiReplyDto>> Handle(GenerateAiReplyCommand request, CancellationToken cancellationToken)
    {
        if (!_chatService.IsConfigured || !_embeddingService.IsConfigured)
            return Result.Failure<AiReplyDto>(
                new Error("Ai.NotConfigured", "The AI assistant service is not configured."));

        var conversation = await _conversationRepository.GetByIdAsync(
            new ChatConversationId(request.ConversationId), cancellationToken);

        if (conversation is null)
            return Result.Failure<AiReplyDto>(
                new Error("Ai.ConversationNotFound", "Conversation not found."));

        // Tenant isolation: the conversation must belong to the requesting store.
        if (request.ExpectedStoreId is { } expectedStoreId && conversation.StoreId.Value != expectedStoreId)
            return Result.Failure<AiReplyDto>(Error.Unauthorized);

        if (conversation.Status != ConversationStatus.Active)
            return Result.Failure<AiReplyDto>(
                new Error("Ai.ConversationNotActive", "Cannot reply to a closed conversation."));

        var config = await _configRepository.GetByStoreIdAsync(conversation.StoreId, cancellationToken);
        if (config is null || !config.AiAssistantSettings.Enabled)
            return Result.Failure<AiReplyDto>(
                new Error("Ai.Disabled", "The AI assistant is not enabled for this store."));

        var settings = config.AiAssistantSettings;

        var latestCustomerMessage = conversation.Messages
            .Where(m => m.SenderType == MessageSenderType.Customer)
            .OrderBy(m => m.SentAt)
            .LastOrDefault();

        if (latestCustomerMessage is null)
            return Result.Failure<AiReplyDto>(
                new Error("Ai.NoCustomerMessage", "There is no customer message to reply to."));

        var store = await _storeRepository.GetByIdAsync(conversation.StoreId, cancellationToken);
        var storeName = store?.Name.Value ?? "our store";

        // Retrieve relevant store knowledge for the latest question.
        IReadOnlyList<VectorSearchHit> context = Array.Empty<VectorSearchHit>();
        try
        {
            var query = Truncate(latestCustomerMessage.Content, 2000);
            var queryEmbedding = await _embeddingService.GenerateEmbeddingAsync(
                query, AiEmbeddingInputType.Query, cancellationToken);
            context = await _vectorStore.SearchAsync(
                conversation.StoreId, queryEmbedding, topK: 5, minScore: 0.2, cancellationToken);
        }
        catch (Exception ex)
        {
            // Degrade gracefully: still answer, but without retrieved context.
            _logger.LogWarning(ex, "AI knowledge retrieval failed for conversation {ConversationId}", request.ConversationId);
        }

        string replyText;
        if (context.Count == 0)
        {
            // Relevance gate: no store knowledge matched this question, so do NOT call the LLM.
            // This keeps the assistant strictly on-topic (it can't answer general-knowledge
            // questions like "capital of France" from the model's own training) and avoids
            // spending tokens on irrelevant or abusive prompts.
            replyText = AiPromptBuilder.NoInformationReply;
        }
        else
        {
            var systemPrompt = AiPromptBuilder.BuildSystemPrompt(storeName, settings, context);

            var messages = new List<AiChatMessage> { new(AiChatRole.System, systemPrompt) };
            messages.AddRange(BuildHistory(conversation, Math.Min(settings.MaxConversationLength, MaxHistoryMessages)));

            try
            {
                var completion = await _chatService.CompleteAsync(messages, cancellationToken: cancellationToken);
                replyText = string.IsNullOrWhiteSpace(completion.Content)
                    ? AiPromptBuilder.NoInformationReply
                    : completion.Content;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AI chat completion failed for conversation {ConversationId}", request.ConversationId);
                return Result.Failure<AiReplyDto>(
                    new Error("Ai.CompletionFailed", "The AI assistant could not generate a reply."));
            }
        }

        var botMessage = conversation.AddMessage(MessageSenderType.Bot, BotSenderId, Truncate(replyText, 2000));

        // Only surface (and log) product suggestions when the assistant actually answered from
        // store knowledge. When it falls back to the "no information" reply, the retrieved context
        // is not a genuine recommendation, so showing cards / logging suggestions would be misleading.
        var gaveRealReply = !string.Equals(replyText, AiPromptBuilder.NoInformationReply, StringComparison.Ordinal);
        var suggestedProducts = gaveRealReply
            ? BuildSuggestedProducts(context)
            : Array.Empty<AiSuggestedProductDto>();

        // Record analytics: the reply (with retrieved-doc count for knowledge-gap tracking)
        // plus one record per recommended product.
        var logs = new List<AiInteractionLog>
        {
            AiInteractionLog.Reply(conversation.StoreId, conversation.Id, latestCustomerMessage.Content, context.Count)
        };
        logs.AddRange(suggestedProducts.Select(p =>
            AiInteractionLog.ProductSuggested(conversation.StoreId, conversation.Id, p.ProductId)));
        await _interactionLogRepository.AddRangeAsync(logs, cancellationToken);

        await _conversationRepository.UpdateAsync(conversation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var messageDto = new ChatMessageDto
        {
            Id = botMessage.Id.Value,
            ConversationId = botMessage.ConversationId.Value,
            SenderType = botMessage.SenderType.ToString(),
            SenderId = botMessage.SenderId,
            Content = botMessage.Content,
            SentAt = botMessage.SentAt,
            ReadAt = botMessage.ReadAt
        };

        return Result.Success(new AiReplyDto(messageDto, suggestedProducts));
    }

    private static IReadOnlyList<AiSuggestedProductDto> BuildSuggestedProducts(
        IReadOnlyList<VectorSearchHit> context)
    {
        return context
            .Where(r => r.DocType == AiKnowledgeDocumentType.Product)
            .Select(ToSuggestedProduct)
            .OfType<AiSuggestedProductDto>()
            .Where(p => p.InStock)
            .Take(3)
            .ToList();
    }

    private static AiSuggestedProductDto? ToSuggestedProduct(VectorSearchHit hit)
    {
        var metadata = hit.Metadata;
        if (metadata is null ||
            !metadata.TryGetValue("productId", out var productIdRaw) ||
            !Guid.TryParse(productIdRaw, out var productId))
            return null;

        metadata.TryGetValue("slug", out var slug);
        metadata.TryGetValue("currency", out var currency);
        metadata.TryGetValue("imageUrl", out var imageUrl);
        metadata.TryGetValue("nameAr", out var nameAr);

        decimal price = 0;
        if (metadata.TryGetValue("price", out var priceRaw))
            decimal.TryParse(priceRaw, NumberStyles.Any, CultureInfo.InvariantCulture, out price);

        var inStock = true;
        if (metadata.TryGetValue("inStock", out var inStockRaw))
            bool.TryParse(inStockRaw, out inStock);

        return new AiSuggestedProductDto(
            productId,
            hit.Title,
            string.IsNullOrWhiteSpace(nameAr) ? hit.Title : nameAr,
            slug ?? string.Empty,
            price,
            currency ?? string.Empty,
            string.IsNullOrWhiteSpace(imageUrl) ? null : imageUrl,
            inStock);
    }

    private static IEnumerable<AiChatMessage> BuildHistory(ChatConversation conversation, int take)
    {
        return conversation.Messages
            .OrderBy(m => m.SentAt)
            .TakeLast(take)
            .Select(m => new AiChatMessage(MapRole(m.SenderType), m.Content));
    }

    private static AiChatRole MapRole(MessageSenderType senderType) => senderType switch
    {
        MessageSenderType.Customer => AiChatRole.User,
        _ => AiChatRole.Assistant // Bot and Merchant both speak as the assistant side
    };

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];
}
