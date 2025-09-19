# Virtual Tour Guide - Production Configuration Guide

## Environment Variables Required

For the application to work properly in production, the following environment variables need to be configured in your Supabase project:

### Google Maps API Configuration

1. **GOOGLE_MAPS_API_KEY**
   - **Value**: Your Google Maps API key
   - **Required for**: City geocoding, places search, and dynamic tour generation
   - **How to set**: 
     - Go to Supabase Dashboard → Project Settings → Edge Functions
     - Add environment variable: `GOOGLE_MAPS_API_KEY`
     - Value: Your actual Google Maps API key

### Audio Generation Services (Optional - for high-quality audio)

To implement high-quality audio generation for dynamic tours, you can integrate with:

#### Option 1: OpenAI Text-to-Speech
```bash
OPENAI_API_KEY=your_openai_api_key
```

#### Option 2: Google Cloud Text-to-Speech
```bash
GOOGLE_CLOUD_TTS_API_KEY=your_google_cloud_api_key
```

#### Option 3: ElevenLabs
```bash
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## Security Recommendations

### 1. API Key Security
- **Never commit API keys to version control**
- Use Supabase's environment variable management
- Rotate API keys regularly
- Restrict API key permissions to only necessary services

### 2. Google Maps API Security
- Restrict the API key to specific domains
- Enable only required APIs (Geocoding, Places, Maps JavaScript)
- Set usage quotas to prevent abuse

### 3. Database Security
- Ensure RLS (Row Level Security) is enabled
- Review and test all database policies
- Monitor for unusual usage patterns

## Deployment Steps

1. **Configure Environment Variables**
   ```bash
   # In Supabase Dashboard
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

2. **Deploy Edge Functions**
   ```bash
   supabase functions deploy generate-city-tour
   supabase functions deploy get-city-tours
   supabase functions deploy generate-audio
   ```

3. **Update Frontend Configuration**
   - Ensure frontend uses the correct Supabase URL and anon key
   - Test all functionality with production environment

4. **Test Production Deployment**
   - Test San Francisco tour (pre-built content)
   - Test dynamic city generation (Paris, Tokyo, etc.)
   - Test Street View functionality
   - Test audio generation and playback

## Performance Optimizations

### 1. Caching Strategy
- Cache generated tours in the database
- Use Supabase's built-in caching for frequently accessed data
- Consider CDN for static assets

### 2. Audio Storage
- Store generated audio files in Supabase Storage
- Use appropriate compression settings
- Implement lazy loading for audio files

### 3. Map Performance
- Load Google Maps API only when needed
- Use map clustering for multiple markers
- Optimize marker icons and info windows

## Monitoring and Analytics

### 1. Error Tracking
- Monitor edge function logs
- Set up alerts for API failures
- Track user experience metrics

### 2. Usage Analytics
- Monitor popular cities/tours
- Track user engagement with audio features
- Analyze tour completion rates

## Backup and Recovery

### 1. Database Backup
- Configure regular database backups
- Test restore procedures
- Document data recovery processes

### 2. Asset Backup
- Backup audio files and images
- Maintain copies of tour content
- Version control for configuration

## Support and Maintenance

### 1. Regular Updates
- Keep dependencies updated
- Monitor for security patches
- Review and update tour content

### 2. Scaling Considerations
- Monitor API usage and costs
- Plan for increased user load
- Consider implementing rate limiting

---

**Note**: This configuration guide assumes a production environment with proper API keys and security measures in place. For development and testing, the application includes fallback mechanisms, but these should be replaced with proper production configurations.