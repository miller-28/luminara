# Response Types

Built-in response type parsing with automatic content-type detection.

## 📋 Table of Contents

- [Overview](#overview)
- [Available Types](#available-types)
- [Configuration](#configuration)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Luminara automatically detects and parses response content types, with manual override support for all major formats.

### Key Features

- **Auto Detection** - Parses based on Content-Type header
- **Manual Override** - Force specific response type
- **5 Built-in Types** - JSON, Text, Blob, ArrayBuffer, Stream
- **Error Handling** - Graceful fallback for parse errors
- **Type Safety** - Predictable response structure

## Available Types

### 1. JSON (Default)

Automatically parses JSON responses:

```javascript
const response = await api.get('/api/users');
console.log(response.data);  // Parsed JavaScript object
```

### 2. Text

Raw text content:

```javascript
const response = await api.getText('/api/readme');
console.log(response.data);  // String
```

### 3. Blob

Binary data as Blob (files, images):

```javascript
const response = await api.getBlob('/api/download/file.pdf');
console.log(response.data);  // Blob object
```

### 4. ArrayBuffer

Raw binary data as ArrayBuffer:

```javascript
const response = await api.getArrayBuffer('/api/data.bin');
console.log(response.data);  // ArrayBuffer
```

### 5. Stream

Streaming response body:

```javascript
const response = await api.getStream('/api/large-dataset');
const reader = response.data.getReader();

// Process stream chunks
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log('Chunk:', value);
}
```

## Configuration

### Automatic Detection

Luminara auto-detects based on `Content-Type` header:

```javascript
// Response: Content-Type: application/json
const response = await api.get('/api/data');
// → Parsed as JSON automatically

// Response: Content-Type: text/html
const response = await api.get('/api/page');
// → Parsed as Text automatically

// Response: Content-Type: image/png
const response = await api.get('/api/image');
// → Parsed as Blob automatically
```

### Manual Override

Force specific response type:

```javascript
// Force text parsing (even if Content-Type says JSON)
const response = await api.get('/api/data', {
  responseType: 'text'
});

// Force blob parsing
const response = await api.get('/api/data', {
  responseType: 'blob'
});
```

### Response Structure

All responses follow this structure:

```javascript
{
  data: any,              // Parsed response body
  status: number,         // HTTP status code (200, 404, etc.)
  statusText: string,     // Status text ("OK", "Not Found", etc.)
  headers: Headers,       // Response headers
  config: object,         // Request configuration
  request: object         // Original request details
}
```

## Examples

### Example 1: JSON Response (Auto)

```javascript
const api = createLuminara();

// Automatic JSON parsing
const response = await api.get('https://jsonplaceholder.typicode.com/users/1');

console.log(response.data.name);       // "Leanne Graham"
console.log(response.data.email);      // "Sincere@april.biz"
console.log(response.status);          // 200
console.log(response.statusText);      // "OK"
```

### Example 2: Text Response

```javascript
const api = createLuminara();

// Method 1: Typed method
const response1 = await api.getText('https://example.com/readme.txt');
console.log(response1.data);  // Raw text string

// Method 2: Manual override
const response2 = await api.get('https://example.com/readme.txt', {
  responseType: 'text'
});
console.log(response2.data);  // Raw text string
```

### Example 3: Blob Response (File Download)

```javascript
const api = createLuminara();

// Download image as Blob
const response = await api.getBlob('https://picsum.photos/200/300');

// Create object URL
const imageUrl = URL.createObjectURL(response.data);

// Display in img tag
const img = document.createElement('img');
img.src = imageUrl;
document.body.appendChild(img);

// Cleanup when done
URL.revokeObjectURL(imageUrl);
```

### Example 4: ArrayBuffer Response

```javascript
const api = createLuminara();

// Download binary data
const response = await api.getArrayBuffer('/api/data.bin');

// Process binary data
const dataView = new DataView(response.data);
const firstByte = dataView.getUint8(0);
console.log('First byte:', firstByte);

// Convert to typed array
const uint8Array = new Uint8Array(response.data);
console.log('Array length:', uint8Array.length);
```

### Example 5: Stream Response

```javascript
const api = createLuminara();

// Get streaming response
const response = await api.getStream('/api/large-file');

// Read stream
const reader = response.data.getReader();
let receivedLength = 0;
const chunks = [];

while (true) {
  const { done, value } = await reader.read();
  
  if (done) break;
  
  chunks.push(value);
  receivedLength += value.length;
  
  console.log(`Received ${receivedLength} bytes`);
}

// Combine chunks
const chunksAll = new Uint8Array(receivedLength);
let position = 0;

for (const chunk of chunks) {
  chunksAll.set(chunk, position);
  position += chunk.length;
}

console.log('Download complete:', chunksAll.length, 'bytes');
```

### Example 6: Mixed Response Types

```javascript
const api = createLuminara();

async function fetchMixedContent() {
  // JSON API data
  const userData = await api.getJson('/api/users/1');
  console.log('User:', userData.data.name);
  
  // HTML page
  const pageHtml = await api.getText('/about');
  console.log('Page length:', pageHtml.data.length);
  
  // Image file
  const avatar = await api.getBlob('/api/avatar.jpg');
  displayImage(avatar.data);
  
  // Binary data
  const dataset = await api.getArrayBuffer('/api/dataset.bin');
  processData(dataset.data);
}
```

### Example 7: File Upload with Progress

```javascript
const api = createLuminara();

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  // Upload returns JSON response
  const response = await api.postForm('/api/upload', formData);
  
  console.log('Upload complete:', response.data.fileId);
  
  // Download uploaded file as Blob
  const download = await api.getBlob(`/api/files/${response.data.fileId}`);
  
  // Verify file size matches
  console.log('Uploaded:', file.size, 'bytes');
  console.log('Downloaded:', download.data.size, 'bytes');
}

const fileInput = document.querySelector('#file-input');
fileInput.addEventListener('change', (e) => {
  uploadFile(e.target.files[0]);
});
```

### Example 8: Error Response Handling

```javascript
const api = createLuminara();

try {
  const response = await api.get('/api/data');
  console.log('Success:', response.data);
} catch (error) {
  // Error responses are also parsed
  if (error.response) {
    // JSON error body
    console.error('Error data:', error.response.data);
    console.error('Error status:', error.response.status);
    
    // Example error.response.data:
    // {
    //   error: "Not Found",
    //   message: "Resource does not exist",
    //   code: 404
    // }
  }
}
```

### Example 9: Custom Response Type per Request

```javascript
const api = createLuminara();

// Same endpoint, different response types
const jsonData = await api.get('/api/data', {
  responseType: 'json'
});

const textData = await api.get('/api/data', {
  responseType: 'text'
});

console.log('JSON:', typeof jsonData.data);    // "object"
console.log('Text:', typeof textData.data);    // "string"
```

## Best Practices

### ✅ DO

- **Trust auto-detection** - Works for 95% of cases
- **Use typed methods** - `getJson()`, `getText()`, `getBlob()` for clarity
- **Check Content-Type** - Verify server sends correct headers
- **Handle parse errors** - JSON parsing can fail
- **Cleanup Blobs** - Revoke object URLs when done

### ❌ DON'T

- **Force wrong type** - Don't parse JSON as text without reason
- **Ignore Content-Type** - Server might send unexpected format
- **Leak blob URLs** - Always revoke with `URL.revokeObjectURL()`
- **Parse large JSON in stream** - Use streaming for large datasets

## Response Type Use Cases

| Type | Use Case | Example |
|------|----------|---------|
| **JSON** | REST APIs, data endpoints | `/api/users`, `/api/posts` |
| **Text** | HTML, plain text, CSV | `/readme.txt`, `/export.csv` |
| **Blob** | File downloads, images | `/download/file.pdf`, `/avatar.jpg` |
| **ArrayBuffer** | Binary protocols, WebGL | `/data.bin`, `/textures/image.raw` |
| **Stream** | Large files, progress tracking | `/video.mp4`, `/dataset.csv` |

## Content-Type Mapping

Luminara auto-detects based on these rules:

```javascript
// JSON
'application/json' → JSON
'application/ld+json' → JSON

// Text
'text/plain' → Text
'text/html' → Text
'text/css' → Text
'text/javascript' → Text
'application/xml' → Text

// Blob (everything else)
'image/*' → Blob
'video/*' → Blob
'audio/*' → Blob
'application/pdf' → Blob
'application/octet-stream' → Blob
```

## Advanced Patterns

### Pattern 1: Conditional Parsing

```javascript
async function smartFetch(url) {
  const response = await api.get(url);
  
  const contentType = response.headers.get('Content-Type');
  
  if (contentType.includes('json')) {
    return response.data;  // Already parsed
  } else if (contentType.includes('text')) {
    return response.data;  // Already text
  } else {
    // Binary data
    return response.data;  // Blob
  }
}
```

### Pattern 2: Progressive Image Loading

```javascript
async function loadImageProgressive(url) {
  // First: Load low-res as Blob
  const lowRes = await api.getBlob(`${url}?quality=low`);
  const lowResUrl = URL.createObjectURL(lowRes.data);
  
  // Display low-res immediately
  img.src = lowResUrl;
  
  // Then: Load high-res as Blob
  const highRes = await api.getBlob(url);
  const highResUrl = URL.createObjectURL(highRes.data);
  
  // Replace with high-res
  img.src = highResUrl;
  
  // Cleanup
  URL.revokeObjectURL(lowResUrl);
  URL.revokeObjectURL(highResUrl);
}
```

## Performance Impact

**JSON Parsing**: ~0.1ms per 1KB  
**Text Parsing**: Negligible  
**Blob Creation**: ~0.01ms  
**ArrayBuffer**: Negligible  
**Stream**: Depends on processing logic

## See Also

- [Basic Usage](./basic-usage.md)
- [Error Handling](./error-handling.md)
- [Interceptors](./interceptors.md)

---

**📖 [Back to Features Documentation](./README.md)**
