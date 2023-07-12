import React from 'react';
import Avatar from 'react-avatar-edit';

import styled from 'styled-components';

const StyledAvatarEditor = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 3rem;

  .container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    @media only screen and (max-width: 600px) {
      grid-template-columns: 1fr;
    }
    grid-gap: 2rem;
    justify-items: center;
    align-items: center;
  }

  .cropper {
    display: grid;
  }

  .preview {
    display: grid;
    img {
      width: 100%;
      object-fit: contain;
    }
  }

  .upload {
    display: grid;
    justify-items: center;
  }
`;

class AvatarEditor extends React.Component {
  constructor(props) {
    super(props);
    const src = null;
    this.state = {
      preview: null,
      src,
    };
    this.onCrop = this.onCrop.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onBeforeFileLoad = this.onBeforeFileLoad.bind(this);
    this.onUpload = this.onUpload.bind(this);
  }

  onClose() {
    this.setState({ preview: null });
  }

  onCrop(preview) {
    this.setState({ preview });
  }

  onUpload() {
    if (this.props.shortcut) {
      this.props.onClose(this.state.preview);
    } else {
      this.props.handleChange({
        target: {
          value: this.state.preview,
          type: 'data',
          name: 'image',
        },
      });
      this.props.setPreview(this.state.preview);
      this.props.onClose();
    }
  }

  onBeforeFileLoad(elem) {
    if (elem.target.files[0].size > 7168000) {
      alert('File is too big!');
      elem.target.value = '';
    }
  }

  render() {
    return (
      <StyledAvatarEditor>
        <div className="container">
          <div className="cropper">
            <Avatar
              height={200}
              onCrop={this.onCrop}
              onClose={this.onClose}
              onBeforeFileLoad={this.onBeforeFileLoad}
              src={this.state.src}
              exportQuality={1}
            />
          </div>
          <div className="preview">
            {this.state.preview && (
              <img src={this.state.preview} alt="Preview" />
            )}
          </div>
        </div>
        <div className="upload">
          <button onClick={this.onUpload}>{this.props.uploadTitle}</button>
        </div>
      </StyledAvatarEditor>
    );
  }
}

export default AvatarEditor;
