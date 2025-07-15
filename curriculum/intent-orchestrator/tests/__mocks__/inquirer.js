// Mock implementation of inquirer for Jest testing
const inquirer = {
    prompt: jest.fn().mockImplementation(async (questions) => {
        const answers = {};
        
        for (const question of questions) {
            if (question.type === 'input') {
                answers[question.name] = question.name === 'amount' ? '10000' : 'test input';
            } else if (question.type === 'list') {
                answers[question.name] = question.choices ? question.choices[0] : 'test choice';
            } else if (question.type === 'confirm') {
                answers[question.name] = true;
            } else {
                answers[question.name] = 'test value';
            }
        }
        
        return answers;
    })
};

module.exports = inquirer; 