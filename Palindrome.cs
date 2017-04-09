using System;

public class Palindrome
{
    public static bool IsPalindrome(string word)
    {
        string lowerWord = word.ToLower();
        char[] array = lowerWord.ToCharArray();
        Array.Reverse(array);
        string backward = new string(array);
        return lowerWord == backward;
    }

    public static void Main(string[] args)
    {
        Console.WriteLine(Palindrome.IsPalindrome("Deleveled"));
    }
}
