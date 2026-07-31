using Qaflaty.Domain.Common.Errors;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Common;

public class ResultTests
{
    private static readonly Error SampleError = new("Test.Error", "Something went wrong");

    [Fact]
    public void Success_IsSuccess_WithNoError()
    {
        var result = Result.Success();

        Assert.True(result.IsSuccess);
        Assert.False(result.IsFailure);
        Assert.Equal(Error.None, result.Error);
    }

    [Fact]
    public void Failure_IsFailure_WithProvidedError()
    {
        var result = Result.Failure(SampleError);

        Assert.False(result.IsSuccess);
        Assert.True(result.IsFailure);
        Assert.Equal(SampleError, result.Error);
    }

    [Fact]
    public void SuccessOfT_ExposesValue()
    {
        var result = Result.Success(42);

        Assert.True(result.IsSuccess);
        Assert.Equal(42, result.Value);
        Assert.Equal(Error.None, result.Error);
    }

    [Fact]
    public void FailureOfT_AccessingValue_Throws()
    {
        var result = Result.Failure<int>(SampleError);

        Assert.True(result.IsFailure);
        Assert.Equal(SampleError, result.Error);
        Assert.Throws<InvalidOperationException>(() => result.Value);
    }

    [Fact]
    public void Failure_WithNoneError_Throws()
    {
        // Guard: a failed result must carry a real error, never Error.None.
        Assert.Throws<InvalidOperationException>(() => Result.Failure(Error.None));
    }
}
