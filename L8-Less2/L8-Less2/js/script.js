var myHash = new Hash({
    customResultDisplay: {
        'w1': {
            message: "In Worksheet w1, you got ${correctWorksheet} correct out of ${totalWorksheet} questions.",
            'q1': {
                message: "Question q1 was incorrect. The correct answer is ${correctAnswer}.",
                hint: "Hint for Q1: Remember..."
            },
            'q2': {
                message: "Question q2 was incorrect. The correct answer is ${correctAnswer}.",
                hint: "Hint for Q2: Consider..."
            }
            // Additional questions and hints...
        }
        // Additional worksheets...
    }
});
