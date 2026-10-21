/**
 * ChatGPT / DeepSeek Style Plugin Ecosystem Service
 *
 * Provides:
 * - Built-in Official Plugins:
 *    1. Web Search (Live web lookup & fact checking)
 *    2. Python Code Interpreter & Sandbox (Executes code, data analysis, math)
 *    3. DALL-E & Image Generator (Generates & modifies images)
 *    4. Roblox & Game Dev Engine (Generates Luau scripts and .rbxmx models)
 *    5. Wolfram / Advanced Math (Solves math formulas, calculus, physics)
 *    6. GitHub & Code Repository Explorer (Inspects repos, commits, issues)
 * - Custom Plugin Manifests (OpenAPI / JSON Schema url addition)
 * - LocalStorage persistence of enabled plugins
 */

export interface PluginDefinition {
  id: string;
  name: string;
  category: 'official' | 'community' | 'custom';
  description: string;
  icon: string;
  author: string;
  version: string;
  enabled: boolean;
  capabilities: string[];
  manifestUrl?: string;
  apiUrl?: string;
  authType?: 'none' | 'bearer' | 'apiKey';
  authToken?: string;
}

export const DEFAULT_PLUGINS: PluginDefinition[] = [
  {
    id: 'web_search',
    name: 'Live Web Search',
    category: 'official',
    description: 'Searches real-time web pages, news articles, and live internet facts',
    icon: '🌐',
    author: 'Flash AI Systems',
    version: '2.4.0',
    enabled: true,
    capabilities: ['Real-time queries', 'Live citations', 'URL retrieval'],
  },
  {
    id: 'code_interpreter',
    name: 'Python Code Interpreter',
    category: 'official',
    description: 'Executes Python code in a safe sandbox for data science, math, and simulations',
    icon: '🐍',
    author: 'Flash Compute',
    version: '3.1.2',
    enabled: true,
    capabilities: ['Code execution', 'Data charts', 'Algorithm benchmarking'],
  },
  {
    id: 'image_gen',
    name: 'DALL-E & Visual Studio',
    category: 'official',
    description: 'Synthesizes high-resolution concept art, UI mockups, and illustrations',
    icon: '🎨',
    author: 'Flash Creative',
    version: '2.0.0',
    enabled: true,
    capabilities: ['Text-to-Image', 'Image variation', 'Style transfer'],
  },
  {
    id: 'game_bridge',
    name: 'Roblox & Game Dev Engine',
    category: 'official',
    description: 'Generates Luau scripts, Roblox .rbxmx XML models, and game assets',
    icon: '🎮',
    author: 'Roblox Dev Guild',
    version: '1.8.4',
    enabled: false,
    capabilities: ['Luau generation', 'DataStore scripts', 'Obby mechanics'],
  },
  {
    id: 'math_solver',
    name: 'Wolfram Math & Physics',
    category: 'official',
    description: 'Computes complex equations, differential calculus, and structural analysis',
    icon: '📐',
    author: 'Wolfram Alpha Labs',
    version: '2.1.0',
    enabled: false,
    capabilities: ['Calculus', 'Unit conversions', 'Physics formulas'],
  },
  {
    id: 'github_connector',
    name: 'GitHub Repository Sync',
    category: 'community',
    description: 'Inspects open-source repositories, pulls READMEs, and generates pull request summaries',
    icon: '🐙',
    author: 'Open Source Community',
    version: '1.2.0',
    enabled: false,
    capabilities: ['Repo inspection', 'PR templates', 'Issue triage'],
  },
];

class PluginService {
  private plugins: PluginDefinition[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flash_ai_plugins');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.plugins = parsed;
          } else {
            this.plugins = DEFAULT_PLUGINS;
          }
        } catch {
          this.plugins = DEFAULT_PLUGINS;
        }
      } else {
        this.plugins = DEFAULT_PLUGINS;
      }
    } else {
      this.plugins = DEFAULT_PLUGINS;
    }
  }

  public getPlugins(): PluginDefinition[] {
    return [...this.plugins];
  }

  public getActivePlugins(): PluginDefinition[] {
    return this.plugins.filter((p) => p.enabled);
  }

  public togglePlugin(id: string): void {
    this.plugins = this.plugins.map((p) =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    );
    this.save();
  }

  public setPluginEnabled(id: string, enabled: boolean): void {
    this.plugins = this.plugins.map((p) =>
      p.id === id ? { ...p, enabled } : p
    );
    this.save();
  }

  public addCustomPlugin(plugin: Omit<PluginDefinition, 'id' | 'category' | 'enabled'>): PluginDefinition {
    const newPlugin: PluginDefinition = {
      ...plugin,
      id: `custom_${Date.now()}`,
      category: 'custom',
      enabled: true,
    };
    this.plugins.push(newPlugin);
    this.save();
    return newPlugin;
  }

  public removePlugin(id: string): void {
    this.plugins = this.plugins.filter((p) => p.id !== id);
    this.save();
  }

  private save(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('flash_ai_plugins', JSON.stringify(this.plugins));
    }
  }
}

export const pluginService = new PluginService();
