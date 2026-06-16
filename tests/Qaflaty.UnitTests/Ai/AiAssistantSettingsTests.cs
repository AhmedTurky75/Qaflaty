using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.ValueObjects;
using Xunit;

namespace Qaflaty.UnitTests.Ai;

public class AiAssistantSettingsTests
{
    [Fact]
    public void CreateDefault_IsDisabled_WithSensibleDefaults()
    {
        var settings = AiAssistantSettings.CreateDefault();

        Assert.False(settings.Enabled);
        Assert.False(settings.DisableHumanChat);
        Assert.Null(settings.AssistantName);
        Assert.Equal(AssistantPersonality.Friendly, settings.Personality);
        Assert.Equal(AssistantLanguage.AutoDetect, settings.Language);
        Assert.Equal(50, settings.MaxConversationLength);
        Assert.Null(settings.EnabledHoursStart);
        Assert.Null(settings.EnabledHoursEnd);
    }

    [Theory]
    [InlineData(0, 50)]     // non-positive -> default 50
    [InlineData(-5, 50)]
    [InlineData(10, 10)]    // kept
    [InlineData(9999, 500)] // clamped to max 500
    public void Create_NormalizesMaxConversationLength(int input, int expected)
    {
        var settings = AiAssistantSettings.Create(
            true, false, "Sara", "Hi", AssistantPersonality.Professional,
            AssistantLanguage.English, null, null, input);

        Assert.Equal(expected, settings.MaxConversationLength);
    }

    [Fact]
    public void Create_TrimsAndNullsBlankNameAndWelcome()
    {
        var settings = AiAssistantSettings.Create(
            true, false, "   ", "  Welcome  ", AssistantPersonality.Friendly,
            AssistantLanguage.AutoDetect, null, null, 20);

        Assert.Null(settings.AssistantName);
        Assert.Equal("Welcome", settings.WelcomeMessage);
    }

    [Theory]
    [InlineData(-3, 0)]   // clamped low
    [InlineData(30, 23)]  // clamped high
    [InlineData(8, 8)]
    public void Create_ClampsEnabledHoursToValidRange(int input, int expected)
    {
        var settings = AiAssistantSettings.Create(
            true, false, null, null, AssistantPersonality.Friendly,
            AssistantLanguage.AutoDetect, input, input, 20);

        Assert.Equal(expected, settings.EnabledHoursStart);
        Assert.Equal(expected, settings.EnabledHoursEnd);
    }

    [Fact]
    public void IsActiveAt_WhenDisabled_IsFalse()
    {
        var settings = AiAssistantSettings.CreateDefault();
        Assert.False(settings.IsActiveAt(DateTime.UtcNow));
    }

    [Fact]
    public void IsActiveAt_WhenEnabledWithNoHours_IsAlwaysActive()
    {
        var settings = AiAssistantSettings.Create(
            true, false, null, null, AssistantPersonality.Friendly,
            AssistantLanguage.AutoDetect, null, null, 20);

        Assert.True(settings.IsActiveAt(new DateTime(2026, 1, 1, 3, 0, 0, DateTimeKind.Utc)));
    }

    [Fact]
    public void IsActiveAt_SameDayWindow_RespectsBounds()
    {
        var settings = AiAssistantSettings.Create(
            true, false, null, null, AssistantPersonality.Friendly,
            AssistantLanguage.AutoDetect, 9, 17, 20);

        Assert.True(settings.IsActiveAt(At(10)));
        Assert.False(settings.IsActiveAt(At(17))); // end is exclusive
        Assert.False(settings.IsActiveAt(At(8)));
    }

    [Fact]
    public void IsActiveAt_OvernightWindow_WrapsMidnight()
    {
        var settings = AiAssistantSettings.Create(
            true, false, null, null, AssistantPersonality.Friendly,
            AssistantLanguage.AutoDetect, 22, 6, 20);

        Assert.True(settings.IsActiveAt(At(23)));
        Assert.True(settings.IsActiveAt(At(2)));
        Assert.False(settings.IsActiveAt(At(12)));
    }

    private static DateTime At(int hour) => new(2026, 1, 1, hour, 0, 0, DateTimeKind.Utc);
}
