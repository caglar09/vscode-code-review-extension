import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigurationManager } from '../../managers/ConfigurationManager';
import { DiagnosticsManager } from '../../managers/DiagnosticsManager';
import { ProviderFactory } from '../../providers/ProviderFactory';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('free-ai-code-reviewer.free-ai-code-reviewer'));
    });

    test('Extension should activate', async () => {
        const extension = vscode.extensions.getExtension('free-ai-code-reviewer.free-ai-code-reviewer');
        if (extension) {
            await extension.activate();
            assert.ok(extension.isActive);
        }
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        const extensionCommands = [
            'freeAICodeReviewer.setApiKey',
            'freeAICodeReviewer.reviewCurrentFile',
            'freeAICodeReviewer.reviewSelectedFiles',
            'freeAICodeReviewer.reviewChangedFiles',
            'freeAICodeReviewer.clearDiagnostics',
            'freeAICodeReviewer.configureProvider',
            'freeAICodeReviewer.selectModel',
            'freeAICodeReviewer.showStatistics'
        ];

        extensionCommands.forEach(command => {
            assert.ok(commands.includes(command), `Command ${command} should be registered`);
        });
    });
});

suite('ConfigurationManager Test Suite', () => {
    let configManager: ConfigurationManager;

    setup(() => {
        configManager = new ConfigurationManager();
    });

    test('Should get default configuration', () => {
        const config = ConfigurationManager.getProviderConfig();
        assert.ok(config);
        assert.strictEqual(config.providerId, 'openrouter');
    });

    test('Should validate configuration', () => {
        const validConfig = {
            providerId: 'openrouter',
            model: 'test-model',
            customEndpoint: '',
            customHeaders: {},
            apiKey: 'test-key'
        };
        assert.ok(ConfigurationManager.validateConfig(validConfig).isValid);

        const invalidConfig = {
            providerId: '',
            model: '',
            customEndpoint: '',
            customHeaders: {},
            apiKey: ''
        };
        assert.ok(!ConfigurationManager.validateConfig(invalidConfig).isValid);
    });
});

suite('DiagnosticsManager Test Suite', () => {
    let diagnosticsManager: DiagnosticsManager;

    setup(() => {
        diagnosticsManager = DiagnosticsManager.getInstance();
    });

    test('Should create diagnostics from comments', () => {
        const comments = [
            {
                line: 1,
                column: 1,
                message: 'Test error message',
                severity: vscode.DiagnosticSeverity.Error,
                category: 'error' as const,
                suggestion: 'Test suggestion'
            },
            {
                line: 5,
                column: 10,
                message: 'Test warning message',
                severity: vscode.DiagnosticSeverity.Warning,
                category: 'warning' as const,
                suggestion: 'Test warning suggestion'
            }
        ];

        const uri = vscode.Uri.file('/test/file.ts');
        diagnosticsManager.setDiagnostics(uri, comments);

        const diagnostics = diagnosticsManager.getDiagnostics(uri);
        assert.strictEqual(diagnostics.length, 2);
        assert.strictEqual(diagnostics[0].message, 'Test error message\n\nSuggestion: Test suggestion');
        assert.strictEqual(diagnostics[0].severity, vscode.DiagnosticSeverity.Error);
        assert.strictEqual(diagnostics[1].severity, vscode.DiagnosticSeverity.Warning);
    });

    test('Should clear diagnostics', () => {
        const comments = [
            {
                line: 1,
                column: 1,
                message: 'Test message',
                severity: vscode.DiagnosticSeverity.Error,
                category: 'error' as const,
                suggestion: 'Test suggestion'
            }
        ];

        const uri = vscode.Uri.file('/test/file.ts');
        diagnosticsManager.setDiagnostics(uri, comments);
        assert.strictEqual(diagnosticsManager.getDiagnostics(uri).length, 1);

        diagnosticsManager.clearDiagnostics(uri);
        assert.strictEqual(diagnosticsManager.getDiagnostics(uri).length, 0);
    });

    test('Should get statistics', () => {
        const comments = [
            {
                line: 1,
                column: 1,
                message: 'Error message',
                severity: vscode.DiagnosticSeverity.Error,
                category: 'error' as const,
                suggestion: 'Error suggestion'
            },
            {
                line: 2,
                column: 1,
                message: 'Warning message',
                severity: vscode.DiagnosticSeverity.Warning,
                category: 'warning' as const,
                suggestion: 'Warning suggestion'
            },
            {
                line: 3,
                column: 1,
                message: 'Info message',
                severity: vscode.DiagnosticSeverity.Information,
                category: 'info' as const,
                suggestion: 'Info suggestion'
            }
        ];

        const uri = vscode.Uri.file('/test/file.ts');
        diagnosticsManager.setDiagnostics(uri, comments);

        const stats = diagnosticsManager.getStatistics();
        assert.strictEqual(stats.totalDiagnostics, 3);
        assert.strictEqual(stats.errorCount, 1);
        assert.strictEqual(stats.warningCount, 1);
        assert.strictEqual(stats.infoCount, 1);
    });
});

suite('ProviderFactory Test Suite', () => {
    test('Should create OpenRouter provider', () => {
        const config = {
            providerId: 'openrouter',
            model: 'test-model',
            customEndpoint: '',
            customHeaders: {},
            apiKey: 'test-key'
        };

        const provider = ProviderFactory.createProvider(config);
        assert.ok(provider);
        assert.strictEqual(provider.constructor.name, 'OpenRouterProvider');
    });

    test('Should create Gemini provider', () => {
        const config = {
            providerId: 'gemini',
            model: 'test-model',
            customEndpoint: '',
            customHeaders: {},
            apiKey: 'test-key'
        };

        const provider = ProviderFactory.createProvider(config);
        assert.ok(provider);
        assert.strictEqual(provider.constructor.name, 'GeminiProvider');
    });

    test('Should create Custom provider', () => {
        const config = {
            providerId: 'custom',
            model: 'test-model',
            customEndpoint: 'https://api.example.com',
            customHeaders: {},
            apiKey: 'test-key'
        };

        const provider = ProviderFactory.createProvider(config);
        assert.ok(provider);
        assert.strictEqual(provider.constructor.name, 'CustomProvider');
    });

    test('Should throw error for unsupported provider', () => {
        const config = {
            providerId: 'unsupported',
            model: 'test-model',
            customEndpoint: '',
            customHeaders: {},
            apiKey: 'test-key'
        };

        assert.throws(() => {
            ProviderFactory.createProvider(config);
        }, /Unsupported provider/);
    });

    test('Should get available providers', () => {
        const providers = ProviderFactory.getAvailableProviders();
        assert.ok(providers.includes('openrouter'));
        assert.ok(providers.includes('gemini'));
        assert.ok(providers.includes('custom'));
    });

    test('Should check provider support', () => {
        assert.ok(ProviderFactory.isProviderSupported('openrouter'));
        assert.ok(ProviderFactory.isProviderSupported('gemini'));
        assert.ok(ProviderFactory.isProviderSupported('custom'));
        assert.ok(!ProviderFactory.isProviderSupported('unsupported'));
    });
});