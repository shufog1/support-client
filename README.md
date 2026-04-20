# IT Support Client

A streamlined desktop application for creating support tickets with automatic system information collection.

## Features

- **One-click ticket creation** with auto-populated system information
- **Screenshot capture** and annotation
- **Live chat integration** with support team
- **System utilities** for quick troubleshooting
- **Zoho Desk integration** for ticket management
- **System tray integration** for quick access

## Development Setup

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Windows 10/11 (for full system info collection)

### Installation

```bash
# Clone the repository
git clone [your-repo-url]
cd IT-Support-Client

# Install dependencies
npm install

# Start development server
npm run dev

# Or start normally
npm start
```

### Build for Production

```bash
# Build for Windows
npm run build-win

# Build for all platforms
npm run build
```

## Project Structure

```
IT-Support-Client/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # UI (HTML/CSS/JS)
│   ├── utils/          # System info collection
│   └── integrations/   # Zoho APIs
├── assets/             # Icons, logos
├── build/              # Build configurations
└── dist/               # Distribution files
```

## Configuration

### Zoho Integration

1. Set up Zoho Desk API credentials
2. Configure SalesIQ widget code
3. Update environment variables:

```bash
ZOHO_ORG_ID=your_org_id
ZOHO_API_TOKEN=your_api_token
ZOHO_DEPARTMENT_ID=your_department_id
ZOHO_SALESIQ_WIDGET_CODE=your_widget_code
```

### User Settings

User preferences are stored locally in `localStorage`:
- User profile information
- Application preferences
- System monitoring settings

## Development Phases

### Phase 1: ✅ Basic Structure
- Electron app setup
- UI implementation
- System information collection
- Mock integrations

### Phase 2: 🚧 Core Features (Current)
- Real system info collection
- Form validation and submission
- Settings management
- Error handling

### Phase 3: 📋 Planned
- Zoho Desk API integration
- SalesIQ chat widget
- File attachments

### Phase 4: 📋 Planned
- Screenshot capture and annotation
- Image upload functionality
- Advanced editing tools

### Phase 5: 📋 Planned
- System utilities implementation
- PowerShell integration
- Administrative tools

### Phase 6: 📋 Planned
- Auto-updater
- Code signing
- MSI installer
- Group Policy deployment

## Scripts

- `npm start` - Start the application
- `npm run dev` - Start with development tools
- `npm run build` - Build for production
- `npm run build-win` - Build Windows installer

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Common Issues

**App won't start:**
- Check Node.js version (16+ required)
- Run `npm install` to ensure dependencies are installed
- Check console for error messages

**System info not loading:**
- Run as administrator for full system access
- Check Windows version compatibility
- Verify PowerShell execution policy

**Build fails:**
- Ensure all dependencies are installed
- Check disk space for build output
- Verify code signing certificates (if configured)

### Debug Mode

Run with `npm run dev` to enable:
- Developer tools
- Hot reload
- Console logging
- Debug information

## License

MIT License - see LICENSE file for details

## Support

For development questions:
- Check the console for error messages
- Review the troubleshooting section
- Open an issue on GitHub

For end-user support:
- Use the built-in chat feature
- Submit a ticket through the app
- Contact IT support directly

## Version History

- **1.0.0** - Initial release with basic functionality
- **0.9.0** - Beta release for testing
- **0.8.0** - Alpha release with core features