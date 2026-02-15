using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Communication.DTOs;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.ChatConversation;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Application.Communication.Commands.StartConversation;

public sealed class StartConversationCommandHandler : ICommandHandler<StartConversationCommand, ChatConversationDto>
{
    private readonly IChatConversationRepository _conversationRepository;
    private readonly IUnitOfWork _unitOfWork;

    public StartConversationCommandHandler(
        IChatConversationRepository conversationRepository,
        IUnitOfWork unitOfWork)
    {
        _conversationRepository = conversationRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ChatConversationDto> Handle(StartConversationCommand request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);
        var customerId = request.CustomerId.HasValue ? new StoreCustomerId(request.CustomerId.Value) : null;

        // Check if there's already an active conversation
        ChatConversation? conversation = null;

        if (customerId is not null)
        {
            conversation = await _conversationRepository.GetActiveConversationByCustomerIdAsync(
                storeId, customerId, cancellationToken);
        }
        else if (!string.IsNullOrWhiteSpace(request.GuestSessionId))
        {
            conversation = await _conversationRepository.GetActiveConversationByGuestSessionAsync(
                storeId, request.GuestSessionId, cancellationToken);
        }

        // Create new conversation if none exists
        if (conversation is null)
        {
            conversation = ChatConversation.Create(storeId, customerId, request.GuestSessionId);
            await _conversationRepository.AddAsync(conversation, cancellationToken);
        }

        // Add initial message if provided
        if (!string.IsNullOrWhiteSpace(request.InitialMessage))
        {
            var senderId = customerId?.Value.ToString();
            conversation.AddMessage(MessageSenderType.Customer, senderId, request.InitialMessage);
            await _conversationRepository.UpdateAsync(conversation, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(conversation);
    }

    private static ChatConversationDto MapToDto(ChatConversation conversation)
    {
        return new ChatConversationDto
        {
            Id = conversation.Id.Value,
            StoreId = conversation.StoreId.Value,
            CustomerId = conversation.CustomerId?.Value,
            GuestSessionId = conversation.GuestSessionId,
            Status = conversation.Status,
            StartedAt = conversation.StartedAt,
            ClosedAt = conversation.ClosedAt,
            LastMessageAt = conversation.LastMessageAt,
            UnreadMerchantMessages = conversation.UnreadMerchantMessages,
            UnreadCustomerMessages = conversation.UnreadCustomerMessages,
            Messages = conversation.Messages.Select(m => new ChatMessageDto
            {
                Id = m.Id.Value,
                ConversationId = m.ConversationId.Value,
                SenderType = m.SenderType,
                SenderId = m.SenderId,
                Content = m.Content,
                SentAt = m.SentAt,
                ReadAt = m.ReadAt
            }).ToList()
        };
    }
}
