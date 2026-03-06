# DigitalOcean Spaces Integration Plan

## Problem Statement

The Forge app currently faces a scaling limitation:
- **Local Development**: App runs on localhost, can't provide public URLs for API calls
- **Fal.ai URL Expiration**: Generated image URLs only persist for 7 days
- **API Requirements**: External services need persistent, publicly accessible image URLs

## Solution: DigitalOcean Spaces Integration

Integrate DigitalOcean Spaces (S3-compatible object storage) to provide:
- ✅ Persistent public URLs that never expire
- ✅ CDN-backed delivery for global performance  
- ✅ Cost-effective storage (~$5/month for 250GB + $1/TB transfer)
- ✅ S3-compatible API for easy integration

## Current Infrastructure

Based on existing DigitalOcean Spaces setup:
- **Space Name**: `matres`
- **Region**: `nyc3` (New York 3)
- **Origin Endpoint**: `https://matres.nyc3.digitaloceanspaces.com`
- **CDN Status**: ✅ Enabled
- **Access**: Restricted (requires access keys)

## Implementation Plan

### Phase 1: Environment Setup

#### 1.1 Create Access Keys
- Navigate to DigitalOcean Spaces → matres → Settings → Access Keys
- Create new access key for Forge integration
- Store credentials securely

#### 1.2 Environment Variables
Add to `.env.local`:
```bash
# DigitalOcean Spaces Configuration
DO_SPACES_KEY=your_access_key_here
DO_SPACES_SECRET=your_secret_key_here
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=matres
DO_SPACES_REGION=nyc3
DO_SPACES_CDN_ENDPOINT=https://matres.nyc3.cdn.digitaloceanspaces.com
```

#### 1.3 Install Dependencies
```bash
npm install aws-sdk
# OR for smaller bundle size
npm install @aws-sdk/client-s3
```

### Phase 2: Core Integration

#### 2.1 Create Spaces Service
File: `src/services/spacesService.ts`

```typescript
import AWS from 'aws-sdk';

// Configure DigitalOcean Spaces (S3-compatible)
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT!);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY!,
  secretAccessKey: process.env.DO_SPACES_SECRET!,
  s3ForcePathStyle: false, // Configures to use subdomain/virtual calling format
  signatureVersion: 'v4'
});

export class SpacesService {
  private bucket = process.env.DO_SPACES_BUCKET!;
  private cdnEndpoint = process.env.DO_SPACES_CDN_ENDPOINT!;

  async uploadImage(
    imageBuffer: Buffer, 
    filename: string, 
    contentType: string = 'image/jpeg'
  ): Promise<string> {
    const params = {
      Bucket: this.bucket,
      Key: `images/${filename}`,
      Body: imageBuffer,
      ACL: 'public-read',
      ContentType: contentType,
      CacheControl: 'max-age=31536000', // 1 year cache
    };

    try {
      const result = await s3.upload(params).promise();
      // Return CDN URL for better performance
      return `${this.cdnEndpoint}/images/${filename}`;
    } catch (error) {
      console.error('Error uploading to Spaces:', error);
      throw error;
    }
  }

  async deleteImage(filename: string): Promise<boolean> {
    const params = {
      Bucket: this.bucket,
      Key: `images/${filename}`
    };

    try {
      await s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      console.error('Error deleting from Spaces:', error);
      return false;
    }
  }

  getPublicUrl(filename: string): string {
    return `${this.cdnEndpoint}/images/${filename}`;
  }
}

export const spacesService = new SpacesService();
```

#### 2.2 Modify Image Generator
Update `src/utils/fal-image-generator.ts`:

```typescript
import { spacesService } from '@/services/spacesService';

export async function saveImageWithMetadata(
  imageUrl: string, 
  metadata: ImageMetadata, 
  projectId: string = 'default',
  index?: number
): Promise<{ localPath: string; publicUrl: string }> {
  try {
    // ... existing local save logic ...
    
    // Upload to DigitalOcean Spaces
    const publicUrl = await spacesService.uploadImage(
      Buffer.from(imageBuffer),
      filename,
      'image/jpeg'
    );
    
    // Update metadata with public URL
    const metadataObject = {
      // ... existing metadata ...
      metadata: {
        // ... existing metadata fields ...
        fal_image_url: imageUrl,        // Original Fal URL (expires)
        public_url: publicUrl,          // Persistent DO Spaces URL
        local_path: path.join('images', filename),
        uploaded_at: new Date().toISOString()
      }
    };
    
    // Save updated metadata
    fs.writeFileSync(metadataPath, JSON.stringify(metadataObject, null, 2));
    
    return {
      localPath: path.join('images', filename),
      publicUrl: publicUrl
    };
    
  } catch (error) {
    console.error('Error saving image with Spaces upload:', error);
    throw error;
  }
}
```

#### 2.3 Update Image Display Logic
Modify `src/components/ui/ImageCard.tsx`:

```typescript
// Use public URL if available, fallback to local
const getImageSrc = (image: ImageData): string => {
  // Priority: Public URL > Local > Fal URL (as last resort)
  if (image.metadata?.public_url) {
    return image.metadata.public_url as string;
  }
  return `/images/${image.filename}`;
};

// In component render:
<Image 
  src={getImageSrc(image)}
  alt={image.title}
  // ... other props
/>
```

### Phase 3: API Enhancement

#### 3.1 Public URL API Endpoint
File: `src/app/api/images/public-url/[imageId]/route.ts`

```typescript
import { databaseService } from '@/services/databaseService';
import { spacesService } from '@/services/spacesService';

export async function GET(
  request: NextRequest,
  { params }: { params: { imageId: string } }
) {
  try {
    const image = await databaseService.getImage(params.imageId);
    
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const publicUrl = image.metadata?.public_url || 
                     spacesService.getPublicUrl(image.filename);

    return NextResponse.json({
      success: true,
      imageId: params.imageId,
      publicUrl: publicUrl,
      filename: image.filename,
      title: image.title
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get public URL' }, 
      { status: 500 }
    );
  }
}
```

### Phase 4: Migration Strategy

#### 4.1 Bulk Upload Existing Images
Create migration script: `scripts/migrate-to-spaces.js`

```javascript
const { spacesService } = require('../src/services/spacesService');
const { getSavedImages } = require('../src/utils/fal-image-generator');
const fs = require('fs');
const path = require('path');

async function migrateExistingImages() {
  const images = getSavedImages();
  console.log(`Migrating ${images.length} images to DigitalOcean Spaces...`);
  
  for (const image of images) {
    try {
      const imagePath = path.join(process.cwd(), 'public', 'images', image.filename);
      const imageBuffer = fs.readFileSync(imagePath);
      
      const publicUrl = await spacesService.uploadImage(
        imageBuffer,
        image.filename,
        'image/jpeg'
      );
      
      // Update metadata file with public URL
      // ... update logic ...
      
      console.log(`✅ Migrated: ${image.filename}`);
    } catch (error) {
      console.error(`❌ Failed to migrate ${image.filename}:`, error);
    }
  }
}
```

#### 4.2 Gradual Rollout
1. **Phase A**: Upload new images to both local + Spaces
2. **Phase B**: Migrate existing images in batches
3. **Phase C**: Switch UI to prefer public URLs
4. **Phase D**: Optional cleanup of local files (keep metadata)

### Phase 5: Configuration & Options

#### 5.1 Feature Toggle
Add to app configuration:
```typescript
interface StorageConfig {
  enableSpacesUpload: boolean;
  preferPublicUrls: boolean;
  keepLocalCopies: boolean;
  autoMigrateOnStartup: boolean;
}
```

#### 5.2 Fallback Strategy
```typescript
const getImageUrl = (image: ImageData): string => {
  // Try public URL first
  if (config.preferPublicUrls && image.metadata?.public_url) {
    return image.metadata.public_url as string;
  }
  
  // Fallback to local
  return `/images/${image.filename}`;
};
```

## Benefits of This Approach

### ✅ **Persistent URLs**
- Images remain accessible indefinitely
- No dependency on Fal.ai URL expiration
- Perfect for API integrations and external sharing

### ✅ **Performance**
- CDN-backed delivery worldwide
- Cached images load faster than localhost
- Reduced bandwidth on your local machine

### ✅ **Scalability**
- Storage scales automatically
- No local disk space concerns
- Works regardless of app deployment location

### ✅ **Reliability**
- 99.9% uptime SLA from DigitalOcean
- Redundant storage across multiple zones
- Professional-grade infrastructure

### ✅ **Cost Effective**
- ~$5/month for 250GB storage
- $1/TB for data transfer
- Much cheaper than comparable AWS S3

## Implementation Checklist

### Pre-Implementation
- [ ] Create DigitalOcean Spaces access key
- [ ] Test S3 API connectivity
- [ ] Plan storage organization (folder structure)
- [ ] Determine migration strategy for existing images

### Development
- [ ] Install AWS SDK
- [ ] Create SpacesService class
- [ ] Modify saveImageWithMetadata function
- [ ] Update image display components
- [ ] Create public URL API endpoints
- [ ] Add configuration toggles

### Testing
- [ ] Test upload functionality
- [ ] Verify public URL accessibility
- [ ] Test fallback mechanisms
- [ ] Load test with multiple concurrent uploads

### Production
- [ ] Run migration script for existing images
- [ ] Monitor upload success rates
- [ ] Set up error alerting
- [ ] Document public URL patterns for API users

## Cost Estimation

Based on DigitalOcean Spaces pricing:
- **Storage**: $5/month for first 250GB
- **CDN Transfer**: $1/TB globally
- **API Requests**: $0.01 per 1,000 requests

**Example Monthly Cost**:
- 10GB images: ~$5.20/month
- 100GB images: ~$7/month  
- 500GB images: ~$15/month

## Security Considerations

### Access Control
- Images set to `public-read` for direct URL access
- Access keys restricted to specific operations
- Environment variables for credential security

### Content Management
- Consider implementing image approval workflow
- Add NSFW content detection if needed
- Implement image expiration policies if desired

## Future Enhancements

### Advanced Features
- **Image Optimization**: Auto-convert to WebP/AVIF
- **Responsive Images**: Generate multiple sizes
- **Smart Caching**: Intelligent local cache management
- **Analytics**: Track image access patterns
- **Backup Strategy**: Cross-region replication

### Integration Opportunities
- **API Documentation**: Swagger docs for public URLs
- **Webhook Notifications**: Alert on successful uploads
- **Bulk Operations**: Mass upload/download tools
- **Content Moderation**: Automated scanning

---

## Implementation Timeline

**Week 1**: Environment setup and basic service creation  
**Week 2**: Integration with existing image generation flow  
**Week 3**: API endpoints and public URL management  
**Week 4**: Migration scripts and testing  
**Week 5**: Production deployment and monitoring

This integration solves the fundamental scaling limitation while maintaining the existing local development workflow and adding enterprise-grade image hosting capabilities. 