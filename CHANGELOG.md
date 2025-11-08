# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **next-electron-rsc Integration**: Migrated from manual HTTP server to IPC-based communication using `next-electron-rsc`
  - Replaced HTTP server startup with protocol interceptor
  - Added `force-dynamic` exports to pages and API routes
  - Configured standalone output mode for production builds
- **Multi-platform Build Support**: Added comprehensive build configurations for Windows, macOS, and Linux
  - Windows: NSIS installer (x64/ARM64) and portable executable
  - macOS: DMG installer
  - Linux: AppImage, Debian package, and RPM package
- **Automated CI/CD**: GitHub Actions workflow for building desktop binaries
  - Automatic builds on push to main and claude/* branches
  - Release creation on version tags
  - Artifact uploads for all platforms with 30-day retention
- **Build Scripts**: Added platform-specific build commands
  - `build:e:win` - Build for Windows
  - `build:e:mac` - Build for macOS
  - `build:e:linux` - Build for Linux
- **Documentation**: Updated README with comprehensive build instructions and download information

### Changed

- **Electron Communication**: Switched from HTTP (localhost:3000) to IPC-based protocol interceptor
  - Eliminates HTTP overhead
  - Removes need to open local ports (improved security)
  - Better integration with React Server Components
- **Build Configuration**: Updated electron-builder settings
  - Changed `asar: true` to `asar: false` (required for next-electron-rsc)
  - Updated file paths to use `.next/standalone/` directory structure
  - Excluded electron from standalone build to prevent bundling issues

### Maintained

- **Full MCP Compatibility**: MCP client continues to run server-side with complete access to:
  - `child_process.spawn()` for stdio-based transport
  - All Node.js APIs
  - Server Actions and API Routes

## [Previous Versions]

### Jun 27, 2025

- Add WebLLM for LocalLLM
  - You might need 'pnpm exec playwright install' to finish the web-llm-middleware installation

### Jun 8, 2025

- Removed next-electron-rsc dependency that was disabling RSC and enabling MCP client from running server-side
- Added @vercel/mcp-adapter example MCP server

### May 3, 2025

- Initial release with Next.js 14 and Electron integration
  - Default package manager must be npm to navigate packages in the packed file
  - Add commands with postfix 'e', `dev:e`, `build:e` and `start:e` for build and dev with Electron
    - `pnpm build && pnpm build:e && pnpm start:e` for building and running application
- Implemented basic chat functionality with Anthropic AI providers
- Added MCP Integration
  - Loading MCP servers from config file
  - Human-in-the-loop for asking permission
  - Customizable UI components for MCP tools
- Patched code from the origin code
- Troubleshooting for Development
