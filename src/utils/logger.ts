// Define log levels and their colors
const colors = {
  info: "\x1b[36m",    // cyan
  warn: "\x1b[33m",    // yellow
  error: "\x1b[31m",   // red
  success: "\x1b[32m", // green
  debug: "\x1b[35m",   // magenta
  reset: "\x1b[0m",    // reset
  bright: "\x1b[1m"    // bright/bold
} as const;

// Define emojis for different log types
const emojis = {
  info: "ℹ️ ",
  warn: "⚠️ ",
  error: "❌",
  success: "✅",
  debug: "🔍",
  start: "🚀",
  end: "🏁",
  database: "🗃️ ",
  test: "🧪"
} as const;

type LogLevel = keyof typeof colors;
type LogPrefix = keyof typeof emojis;

class Logger {
  private format(message: string, level: LogLevel, prefix?: LogPrefix): string {
    const emoji = prefix ? emojis[prefix] : emojis[level as LogPrefix] || '';
    return `${colors[level]}${emoji} ${message}${colors.reset}`;
  }

  info(message: string, prefix?: LogPrefix): void {
    console.log(this.format(message, 'info', prefix));
  }

  warn(message: string, prefix?: LogPrefix): void {
    console.warn(this.format(message, 'warn', prefix));
  }

  error(message: string, prefix?: LogPrefix): void {
    console.error(this.format(message, 'error', prefix));
  }

  success(message: string, prefix?: LogPrefix): void {
    console.log(this.format(message, 'success', prefix));
  }

  debug(message: string, prefix?: LogPrefix): void {
    console.debug(this.format(message, 'debug', prefix));
  }

  // Special formatted sections
  startSection(title: string): void {
    console.log('\n' + this.format(`=== Starting: ${title} ===`, 'info', 'start'));
  }

  endSection(title: string): void {
    console.log(this.format(`=== Completed: ${title} ===`, 'success', 'end') + '\n');
  }

  private formatValue(value: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    
    if (Array.isArray(value)) {
      if (value.length === 0) return `${spaces}[]`;
      return `\n${value.map(item => `${spaces}- ${this.formatValue(item, indent + 1)}`).join('\n')}`;
    }
    
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    if (typeof value === 'object') {
      if (Object.keys(value).length === 0) return `${spaces}{}`;
      return `\n${Object.entries(value)
        .map(([key, val]) => `${spaces}  ${key}: ${this.formatValue(val, indent + 1)}`)
        .join('\n')}`;
    }
    
    return String(value);
  }

  list(title: string, items: any[], level: LogLevel = 'info', prefix?: LogPrefix): void {
    const formattedTitle = title ? `${title}:` : '';
    const formattedItems = this.formatValue(items);
    const message = `${formattedTitle}${formattedItems}`;
    console.log(this.format(message, level, prefix));
  }

  // Database specific logging
  dbQuery(query: string): void {
    this.debug(`Executing query: ${query}`, 'database');
  }

  // Test specific logging
  testStart(suiteName: string): void {
    this.info(`Starting test suite: ${suiteName}`, 'test');
  }

  testEnd(suiteName: string): void {
    this.success(`Completed test suite: ${suiteName}`, 'test');
  }
}

// Export singleton instance
export const logger = new Logger();
