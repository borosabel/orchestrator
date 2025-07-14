export async function askOpenAI(prompt: string) {
    // In real use, call OpenAI. For now, mock it:
    return `MOCKED-LANGCHAIN: You asked: ${prompt}`;
}