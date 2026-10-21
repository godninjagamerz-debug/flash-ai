# 🚀 Flash AI - Advanced Features Guide

## Table of Contents
1. [Pro Account Setup](#pro-account-setup)
2. [Content Moderation](#content-moderation)
3. [Image Generation](#image-generation)
4. [Video Generation](#video-generation)
5. [AI Models](#ai-models)
6. [Feature Permissions](#feature-permissions)

---

## 📧 Pro Account Setup

### Credentials
See `PRO_CREDENTIALS.txt` for complete account details.

**Quick Access:**
- Email: `owner@example.invalid`
- Password: `REDACTED_LEGACY_CREDENTIAL`
- Plan: Pro

### How to Create Account
1. Open Flash AI application
2. Click "Sign Up"
3. Enter credentials from PRO_CREDENTIALS.txt
4. Verify email (if required)
5. Start using Pro features immediately!

---

## 🛡️ Content Moderation

Flash AI includes intelligent content moderation to ensure safe and helpful interactions.

### Features
- **Harmful Content Detection**: Automatically detects and filters harmful prompts
- **Helpful Responses**: Converts inappropriate requests into constructive suggestions
- **Smart Guidance**: Provides alternative suggestions for unclear prompts
- **Family-Friendly**: Ensures all interactions are safe and appropriate

### How It Works
When you send a message, the AI:
1. Analyzes the content for harmful patterns
2. Sanitizes inappropriate language
3. Provides helpful alternative suggestions
4. Guides you toward constructive conversations

### Example Interactions

**Harmful Prompt:**
```
User: "How to hack into a system?"
AI: "I understand you're looking for information, but I'm designed to provide 
     helpful and safe responses. Let me help you with something constructive 
     instead. What would you like to learn about or create today?"
```

**Unclear Prompt:**
```
User: "help"
AI: "I'd love to help you! Could you provide more details about what you're 
     looking for? The more specific you are, the better I can assist you."
```

---

## 🎨 Image Generation

Generate stunning images from text descriptions or transform existing images.

### Available For
- ✅ Pro Plan
- ✅ Business Plan
- ❌ Free Plan (Upgrade required)

### Capabilities

#### 1. Text-to-Image
Create images from text descriptions.

**Example Prompts:**
```
"Generate image: A futuristic city at sunset with flying cars"
"Create image: A cute robot playing with a kitten in a garden"
"Make image: Abstract art with vibrant purple and gold colors"
"Draw a serene mountain landscape with a crystal clear lake"
```

#### 2. Image-to-Image
Transform existing images with AI.

**How to Use:**
1. Upload an image using the paperclip icon
2. Type your transformation prompt
3. Example: "Convert this to cartoon style"
4. Example: "Make this look like a watercolor painting"

#### 3. Multi-Image Synthesis
Combine multiple images intelligently.

**How to Use:**
1. Upload 2-3 images
2. Type synthesis prompt
3. Example: "Combine these images into a cohesive scene"

### Technical Details
- **API**: Nano Banana Image Generation
- **Max Size**: 20MB total request size
- **Formats**: PNG, JPEG, WebP
- **Generation Time**: Up to 30 seconds
- **Output Quality**: High resolution (up to 4K)

### Tips for Best Results
1. **Be Specific**: Include details about style, colors, mood
2. **Use Descriptive Language**: "vibrant", "serene", "dramatic"
3. **Specify Art Style**: "cartoon", "realistic", "watercolor", "3D render"
4. **Include Context**: Setting, lighting, atmosphere

---

## 🎬 Video Generation

Create videos from text descriptions or animate images.

### Available For
- ✅ Pro Plan (Full access)
- ✅ Business Plan (Full access)
- ❌ Free Plan (Upgrade required)
- ❌ Hero Plan (Upgrade required)

### Capabilities

#### 1. Text-to-Video
Generate videos from text descriptions.

**Example Prompts:**
```
"Generate video: Ocean waves crashing on a beach at sunset"
"Create video: Time-lapse of a flower blooming"
"Make video: A butterfly flying through a garden"
"Animate: Clouds moving across a blue sky"
```

#### 2. Image-to-Video
Animate static images.

**How to Use:**
1. Upload an image
2. Type animation prompt
3. Example: "Animate this image with gentle movement"
4. Example: "Add wind effect to this landscape"

### Technical Details
- **API**: Kling Video Generation
- **Models**: kling-v2-5-turbo (fastest), kling-v2-1-master (highest quality)
- **Duration**: 5 or 10 seconds
- **Aspect Ratios**: 16:9, 9:16, 1:1
- **Generation Time**: Up to 10 minutes
- **Max Image Size**: 10MB
- **Min Dimensions**: 300px width/height

### Video Generation Process
1. **Submit Request**: Your prompt is sent to the API
2. **Task Created**: You receive a task ID
3. **Processing**: Video is generated (5-10 minutes)
4. **Polling**: System checks status every 5 seconds
5. **Completion**: Video URL is provided when ready

### Tips for Best Videos
1. **Keep It Simple**: Short, focused scenes work best
2. **Describe Motion**: "gentle breeze", "slow zoom", "rotating"
3. **Set the Scene**: Include environment and lighting details
4. **Choose Duration**: 5s for quick clips, 10s for more complex scenes

---

## ⚡ AI Models

Flash AI offers two powerful AI models.

### Flash AI (Default)
- **Speed**: Fast
- **Creativity**: Balanced
- **Best For**: General conversations, coding, explanations
- **Available**: All plans
- **Icon**: ⚡ Blue gradient

### Lightning McQueen
- **Speed**: Ultra-fast
- **Creativity**: High
- **Best For**: Creative writing, brainstorming, quick responses
- **Available**: Pro and Business plans
- **Icon**: ⚡ Red-orange gradient

### How to Switch Models
1. Look for the AI selector in the header
2. Click to toggle between Flash AI and Lightning McQueen
3. Your selection persists across sessions

### Model Comparison

| Feature | Flash AI | Lightning McQueen |
|---------|----------|-------------------|
| Speed | Fast | Ultra-fast |
| Creativity | Balanced | High |
| Temperature | 1.0 | 0.9 |
| Max Tokens | 8192 | 8192 |
| Plans | All | Pro, Business |

---

## 🔐 Feature Permissions

Different features are available based on your plan.

### Free Plan
- ✅ Flash AI model
- ✅ Basic conversations
- ✅ Image analysis (upload and ask)
- ✅ 100MB file upload
- ❌ Image generation
- ❌ Video generation
- ❌ Lightning McQueen AI

### Hero Plan (₹1,299/year)
- ✅ Flash AI model
- ✅ 500MB file upload
- ✅ Faster response time
- ✅ Advanced image analysis
- ❌ Image generation
- ❌ Video generation
- ❌ Lightning McQueen AI

### Pro Plan (₹3,999/year)
- ✅ Flash AI model
- ✅ Lightning McQueen AI
- ✅ 1GB file upload
- ✅ **Image generation** (text-to-image, image-to-image)
- ✅ **Video generation** (text-to-video, image-to-video)
- ✅ Image analysis
- ✅ Priority support

### Business Plan (₹9,999/year)
- ✅ Flash AI model
- ✅ Lightning McQueen AI
- ✅ 2GB file upload
- ✅ **Image generation** (all types)
- ✅ **Video generation** (text-to-video, image-to-video)
- ✅ Priority support
- ✅ Advanced analytics
- ✅ Team collaboration

---

## 💡 Usage Examples

### Example 1: Creative Image Generation
```
Prompt: "Generate image: A magical forest with glowing mushrooms and 
         fireflies, fantasy art style, vibrant colors, mystical atmosphere"

Result: High-quality fantasy image with specified elements
Time: ~20 seconds
```

### Example 2: Image Transformation
```
1. Upload: Photo of a person
2. Prompt: "Convert this to a professional cartoon avatar style"

Result: Cartoon version of the uploaded photo
Time: ~25 seconds
```

### Example 3: Video Creation
```
Prompt: "Generate video: A peaceful zen garden with koi fish swimming 
         in a pond, gentle water ripples, 10 seconds"

Result: 10-second video of zen garden scene
Time: ~8 minutes
```

### Example 4: Content Moderation
```
User: "Tell me how to break into..."
AI: "I understand you're looking for information, but I'm designed to 
     provide helpful and safe responses. How about I help you with:
     - Learning about cybersecurity
     - Understanding network security
     - Exploring ethical hacking courses
     - Building secure systems"
```

---

## 🎯 Best Practices

### For Image Generation
1. **Use Keywords**: "high quality", "detailed", "professional"
2. **Specify Style**: "photorealistic", "cartoon", "oil painting"
3. **Include Mood**: "cheerful", "dramatic", "serene"
4. **Set Context**: Time of day, weather, setting

### For Video Generation
1. **Describe Motion**: "slow pan", "zoom in", "rotating"
2. **Keep It Focused**: One main subject or scene
3. **Set Duration**: Match complexity to duration
4. **Be Patient**: Video generation takes time

### For AI Conversations
1. **Be Specific**: Clear questions get better answers
2. **Provide Context**: Background information helps
3. **Use Examples**: Show what you're looking for
4. **Iterate**: Refine based on responses

---

## 🆘 Troubleshooting

### Image Generation Issues

**Problem**: "Image generation failed"
- **Solution**: Check your plan (Pro or Business required)
- **Solution**: Ensure prompt is clear and appropriate
- **Solution**: Try a simpler prompt

**Problem**: "Request too large"
- **Solution**: Reduce image sizes (max 20MB total)
- **Solution**: Use fewer images
- **Solution**: Compress images before upload

### Video Generation Issues

**Problem**: "Video generation timeout"
- **Solution**: Try a simpler scene
- **Solution**: Use 5-second duration instead of 10
- **Solution**: Retry with different prompt

**Problem**: "Task failed"
- **Solution**: Check image dimensions (min 300px)
- **Solution**: Verify aspect ratio (1:2.5 to 2.5:1)
- **Solution**: Ensure image is under 10MB

### Content Moderation

**Problem**: "Content blocked"
- **Solution**: Rephrase your request constructively
- **Solution**: Use the suggested alternatives
- **Solution**: Focus on educational or creative goals

---

## 📞 Support

### Getting Help
- **Email**: support@flashai.com
- **In-App**: Profile → Help & Support
- **Documentation**: Check this guide and PRO_ACCOUNT_SETUP.md

### Reporting Issues
When reporting issues, include:
1. Your plan type
2. Feature you're using
3. Exact error message
4. Steps to reproduce

---

## 🎉 Conclusion

Flash AI Pro gives you access to cutting-edge AI capabilities:
- 🎨 Generate stunning images
- 🎬 Create amazing videos
- ⚡ Ultra-fast AI responses
- 🛡️ Safe, moderated interactions
- 💎 Premium features and support

**Start exploring today!**

---

**Version**: 2.0.0  
**Last Updated**: 2025-11-23  
**Status**: ✅ Production Ready

© 2025 Flash AI - Your Intelligent AI Assistant
