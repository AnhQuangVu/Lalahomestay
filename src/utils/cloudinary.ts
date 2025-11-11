// Cloudinary configuration for image uploads
export const CLOUDINARY_CONFIG = {
    cloudName: 'dumxzdunu',
    uploadPreset: 'lalahome_cccd',
};

export const uploadToCloudinary = async (file: File, folder: string = 'cccd'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', folder);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Cloudinary upload error:', data);
            throw new Error(data.error?.message || `Upload failed: ${response.status} ${response.statusText}`);
        }

        return data.secure_url; // Trả về URL của ảnh
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
};
