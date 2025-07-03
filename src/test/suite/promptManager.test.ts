import * as assert from 'assert';
import { PromptManager } from '../../managers/PromptManager';

suite('PromptManager Test Suite', () => {
    test('createReviewPrompt should return valid prompt', () => {
        const diff = '+console.log("test");';
        const languageId = 'javascript';

        const prompt = PromptManager.createReviewPrompt(diff, languageId);

        assert.ok(prompt.includes(languageId));
        assert.ok(prompt.includes(diff));
        assert.ok(prompt.includes('JSON formatında'));
        assert.ok(prompt.includes('comments'));
    });

    test('createGeminiReviewPrompt should return valid prompt with expert prefix', () => {
        const diff = '+const x = 1;';
        const languageId = 'typescript';

        const prompt = PromptManager.createGeminiReviewPrompt(diff, languageId);

        assert.ok(prompt.includes('Sen uzman bir kod gözden geçiricisisin'));
        assert.ok(prompt.includes(languageId));
        assert.ok(prompt.includes(diff));
        assert.ok(prompt.includes('JSON formatında'));
    });

    test('getSystemMessage should return consistent system message', () => {
        const systemMessage = PromptManager.getSystemMessage();

        assert.ok(systemMessage.includes('uzman bir kod gözden geçiricisisin'));
        assert.ok(systemMessage.includes('JSON formatında'));
        assert.strictEqual(typeof systemMessage, 'string');
        assert.ok(systemMessage.length > 0);
    });

    test('getPromptVariables should return valid structure', () => {
        const variables = PromptManager.getPromptVariables();

        assert.ok(variables.jsonFormat);
        assert.ok(variables.jsonFormat.comments);
        assert.ok(Array.isArray(variables.jsonFormat.comments));
        assert.ok(variables.instructions);
        assert.ok(Array.isArray(variables.instructions));
        assert.ok(variables.instructions.length > 0);
    });

    test('prompts should contain required JSON structure', () => {
        const prompt = PromptManager.createReviewPrompt('test diff', 'javascript');

        assert.ok(prompt.includes('"message"'));
        assert.ok(prompt.includes('"line"'));
        assert.ok(prompt.includes('"severity"'));
        assert.ok(prompt.includes('"category"'));
        assert.ok(prompt.includes('error|warning|info'));
    });

    test('prompts should contain evaluation criteria', () => {
        const prompt = PromptManager.createReviewPrompt('test diff', 'javascript');

        assert.ok(prompt.includes('kod kalitesi') || prompt.includes('Kod kalitesi'));
        assert.ok(prompt.includes('güvenlik'));
        assert.ok(prompt.includes('performans'));
        assert.ok(prompt.includes('en iyi pratikler'));
    });
});