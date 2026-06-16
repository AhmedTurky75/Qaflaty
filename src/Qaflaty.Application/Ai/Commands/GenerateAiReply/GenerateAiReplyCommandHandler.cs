using Microsoft.Extensions.Logging;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.Interfaces.Ai;
using Qaflaty.Application.Communication.DTOs;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.ChatConversation;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Application.Ai.Commands.GenerateAiReply;

public sealed class GenerateAiReplyCommandHandler : ICommandHandler<GenerateAiReplyCommand, ChatMessageDto>
{
    private const string BotSenderId = "ai-assistant";
    private const int MaxHistoryMessages = 20;

    private readonly IChatConversationRepository _conversationRepository;
    private readonly IStoreConfigurationRepository _configRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly IAiEmbeddingService _embeddingService;
    private readonly IAiChatCompletionService _chatService;
    private readonly IAiKnowledgeStore _knowledgeStore;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<GenerateAiReplyCommandHandler> _logger;

    public GenerateAiReplyCommandHandler(
        IChatConversationRepository conversationRepository,
        IStoreConfigurationRepository configRepository,
        IStoreRepository storeRepository,
        IAiEmbeddingService embeddingService,
        IAiChatCompletionService chatService,
        IAiKnowledgeStore knowledgeStore,
        IUnitOfWork unitOfWork,
        ILogger<GenerateAiReplyCommandHandler> logger)
    {
        _conversationRepository = conversationRepository;
        _configRepository = configRepository;
        _storeRepository = storeRepository;
        _embeddingService = embeddingService;
        _chatService = chatService;
        _knowledgeStore = knowledgeStore;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<ChatMessageDto>> Handle(GenerateAiReplyCommand request, CancellationToken cancellationToken)
    {
        if (!_chatService.IsConfigured || !_embeddingService.IsConfigured)
            return Result.Failure<ChatMessageDto>(
                new Error("Ai.NotConfigured", "The AI assistant service is not configured."));

        var conversation = await _conversationRepository.GetByIdAsync(
            new ChatConversationId(request.ConversationId), cancellationToken);

        if (conversation is null)
            return Result.Failure<ChatMessageDto>(
                new Error("Ai.ConversationNotFound", "Conversation not found."));

        // Tenant isolation: the conversation must belong to the requesting store.
        if (request.ExpectedStoreId is { } expectedStoreId && conversation.StoreId.Value != expectedStoreId)
            return Result.Failure<ChatMessageDto>(Error.Unauthorized);

        if (conversation.Status != ConversationStatus.Active)
            return Result.Failure<ChatMessageDto>(
                new Error("Ai.ConversationNotActive", "Cannot reply to a closed conversation."));

        var config = await _configRepository.GetByStoreIdAsync(conversation.StoreId, cancellationToken);
        if (config is null || !config.AiAssistantSettings.Enabled)
            return Result.Failure<ChatMessageDto>(
                new Error("Ai.Disabled", "The AI assistant is not enabled for this store."));

        var settings = config.AiAssistantSettings;

        var latestCustomerMessage = conversation.Messages
            .Where(m => m.SenderType == MessageSenderType.Customer)
            .OrderBy(m => m.SentAt)
            .LastOrDefault();

        if (latestCustomerMessage is null)
            return Result.Failure<ChatMessageDto>(
                new Error("Ai.NoCustomerMessage", "There is no customer message to reply to."));

        var store = await _storeRepository.GetByIdAsync(conversation.StoreId, cancellationToken);
        var storeName = store?.Name.Value ?? "our store";

        // Retrieve relevant store knowledge for the latest question.
        IReadOnlyList<AiKnowledgeSearchResult> context = Array.Empty<AiKnowledgeSearchResult>();
        try
        {
            var query = Truncate(latestCustomerMessage.Content, 2000);
            var queryEmbedding = await _embeddingService.GenerateEmbeddingAsync(query, cancellationToken);
            context = _knowledgeStore.Search(conversation.StoreId.Value, queryEmbedding, topK: 5, minScore: 0.2);
        }
        catch (Exception ex)
        {
            // Degrade gracefully: still answer, but without retrieved context.
            _logger.LogWarning(ex, "AI knowledge retrieval failed for conversation {ConversationId}", request.ConversationId);
        }

        var systemPrompt = AiPromptBuilder.BuildSystemPrompt(storeName, settings, context);

        var messages = new List<AiChatMessage> { new(AiChatRole.System, systemPrompt) };
        messages.AddRange(BuildHistory(conversation, Math.Min(settings.MaxConversationLength, MaxHistoryMessages)));

        string replyText;
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
            return Result.Failure<ChatMessageDto>(
                new Error("Ai.CompletionFailed", "The AI assistant could not generate a reply."));
        }

        var botMessage = conversation.AddMessage(MessageSenderType.Bot, BotSenderId, Truncate(replyText, 2000));

        await _conversationRepository.UpdateAsync(conversation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(new ChatMessageDto
        {
            Id = botMessage.Id.Value,
            ConversationId = botMessage.ConversationId.Value,
            SenderType = botMessage.SenderType.ToString(),
            SenderId = botMessage.SenderId,
            Content = botMessage.Content,
            SentAt = botMessage.SentAt,
            ReadAt = botMessage.ReadAt
        });
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
