import React from 'react';
import Avatar from 'react-avatar-edit';
import styled from 'styled-components';

const StyledAvatarEditor = styled.div`
  display: grid;
  margin: 20px 0px;
  grid-template-columns: 1fr;
  grid-gap: 3rem;

  .container {
    display: grid;
    justify-items: center;
    align-items: center;
  }

  .cropper {
    display: grid;
    position: relative;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    z-index: 10;
    flex-direction: column;
    gap: 1rem;

    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #2185d0;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }

  .upload {
    display: grid;
    justify-items: center;
  }

  input[type="file"] {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
  }

  button {
    padding: 10px 20px;
    background: #2185d0;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;

    &:hover {
      background: #1678d0;
    }

    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }
`;

class AvatarEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      preview: null,
      src: null,
      isProcessing: false,
    };
    this.onCrop = this.onCrop.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onBeforeFileLoad = this.onBeforeFileLoad.bind(this);
    this.onUpload = this.onUpload.bind(this);
    this.processCroppedImage = this.processCroppedImage.bind(this);
  }

  onCrop(preview) {
    this.setState({ preview });
  }

  onClose() {
    this.setState({ preview: null });
  }

  onBeforeFileLoad(elem) {
    if (elem.target.files[0].size > 7168000) {
      alert('File is too big! Maximum size is 7MB.');
      elem.target.value = '';
    }
  }

  // Process the cropped image to ensure max 300px in widest dimension
  processCroppedImage(croppedDataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Find the widest dimension
        const widestDimension = Math.max(width, height);
        const MAX_DIMENSION = 300;

        // Calculate new dimensions maintaining aspect ratio
        if (widestDimension > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / widestDimension;
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = croppedDataUrl;
    });
  }

  async onUpload() {
    if (!this.state.preview) {
      alert('Please crop an image first.');
      return;
    }

    this.setState({ isProcessing: true });
    try {
      // Process the cropped image to ensure it's max 300px
      const processedImage = await this.processCroppedImage(this.state.preview);

      if (this.props.shortcut) {
        this.props.onClose(processedImage);
      } else {
        if (this.props.handleChange) {
          this.props.handleChange({
            target: {
              value: processedImage,
              type: 'data',
              name: 'image',
            },
          });
        }
        if (this.props.setPreview) {
          this.props.setPreview(processedImage);
        }
        if (this.props.onClose) {
          this.props.onClose();
        }
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
      this.setState({ isProcessing: false });
    }
  }

  componentDidUpdate(prevProps) {
    // Reset processing state when external loading takes over
    if (this.props.isLoading && this.state.isProcessing && !prevProps.isLoading) {
      this.setState({ isProcessing: false });
    }
  }

  render() {
    const { uploadTitle, isLoading: externalLoading } = this.props;
    const { preview, isProcessing } = this.state;
    const isUploading = isProcessing || externalLoading;

    return (
      <StyledAvatarEditor>
        <div className="container">
          <div className="cropper">
            {isUploading && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <div>Processing...</div>
              </div>
            )}
            <Avatar
              width={400}
              height={400}
              cropRadius={0}
              exportAsSquare={true}
              exportSize={300}
              onCrop={this.onCrop}
              onClose={this.onClose}
              onBeforeFileLoad={this.onBeforeFileLoad}
              src={this.state.src}
              exportQuality={1}
            />
          </div>
        </div>
        <div className="upload">
          <button onClick={this.onUpload} disabled={!preview || isUploading}>
            {isUploading ? 'Uploading...' : (uploadTitle || 'Upload')}
          </button>
        </div>
      </StyledAvatarEditor>
    );
  }
}

export default AvatarEditor;
