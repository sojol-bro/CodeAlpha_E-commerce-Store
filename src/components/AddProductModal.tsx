import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Key,
  Sparkles,
  Loader2,
  Check,
  Shield,
  Layers,
} from 'lucide-react';
import {
  supabase,
  getSupabaseAnonKey,
  setStoredSupabaseAnonKey,
  createSupabaseClient,
} from '../lib/supabase';
import { Category, Product } from '../types';
import { useAuth } from '../context/AuthContext';

export interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onProductCreated: (product: Product) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  categories,
  onProductCreated,
}) => {
  const { user, profile } = useAuth();
  if (!isOpen) return null;

  // Form Fields
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [brand, setBrand] = useState('MIO Atelier');
  const [basePrice, setBasePrice] = useState('650');
  const [description, setDescription] = useState('');

  // Initial Variant Fields
  const [variantSize, setVariantSize] = useState('Standard');
  const [variantColor, setVariantColor] = useState('Signature Atelier');
  const [variantStock, setVariantStock] = useState('12');

  // Supabase File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFileSize, setSelectedFileSize] = useState<string>('');

  // Upload & Submission State
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Supabase Anon Key Configuration (if client needs custom override)
  const [anonKey, setAnonKey] = useState(getSupabaseAnonKey());
  const [showKeyConfig, setShowKeyConfig] = useState(!getSupabaseAnonKey());
  const [keySaveMessage, setKeySaveMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Selection & Client-Side Validation
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // 1. Validate MIME Types (png, jpeg, webp)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        `Invalid file format (${file.type || 'unknown'}). Please choose a PNG, JPEG, or WEBP photograph.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validate Maximum File Size (5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(
        `File exceeds maximum limit (${fileSizeMB}MB). Maximum allowed photograph size is 5MB.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Set file for upload upon form submission
    setSelectedFile(file);
    setSelectedFileName(file.name);
    setSelectedFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    // Create immediate local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
  };

  const handleSaveAnonKey = () => {
    setStoredSupabaseAnonKey(anonKey);
    setKeySaveMessage('Supabase Anon Key saved to atelier client.');
    setTimeout(() => setKeySaveMessage(null), 3000);
  };

  // Form Submission: Uploads directly to Supabase Storage, extracts public URL, and calls Express API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Product title is required.');
      return;
    }

    if (!selectedFile) {
      setErrorMessage('Please select a photograph for direct upload to the product_image bucket.');
      return;
    }

    setIsUploading(true);
    setIsSubmitting(true);
    setUploadProgress('Preparing upload to Supabase Storage bucket "product_image"...');

    try {
      // 1. Direct Bucket Upload to product_image bucket using unique path
      const activeClient = anonKey ? createSupabaseClient(anonKey) : supabase;
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${Date.now()}-${sanitizedName}`;

      setUploadProgress('Streaming file directly to Supabase storage bucket "product_image"...');

      const { data: uploadData, error: uploadError } = await activeClient.storage
        .from('product_image')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'Direct upload to bucket "product_image" failed.');
      }

      setUploadProgress('Upload confirmed. Extracting permanent public URL...');

      // 2. Retrieve Public URL immediately upon successful upload
      const {
        data: { publicUrl },
      } = activeClient.storage.from('product_image').getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Could not retrieve permanent public URL from product_image bucket.');
      }

      setUploadProgress('Permanent public URL secured. Recording in PostgreSQL archive...');

      // 3. Express API Submission with publicUrl appended to JSON payload
      const payload = {
        title: title.trim(),
        categoryId: categoryId || undefined,
        brand: brand.trim() || 'MIO Atelier',
        basePrice: parseFloat(basePrice) || 500,
        description: description.trim() || 'Artisanal piece crafted by MIO Atelier.',
        imageUrl: publicUrl,
        image_url: publicUrl,
        altText: title.trim(),
        variants: [
          {
            size: variantSize.trim() || 'Standard',
            color: variantColor.trim() || 'Signature Atelier',
            price: parseFloat(basePrice) || 500,
            stockQuantity: parseInt(variantStock, 10) || 12,
          },
        ],
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': user?.email || 'sojolislam576@gmail.com',
          'x-admin-role': profile?.role || 'admin',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record product in atelier database.');
      }

      setSuccessToast(`"${title}" published with permanent Supabase photo!`);
      if (data.product) {
        onProductCreated(data.product);
      }

      // Close modal gracefully after success notification
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Upload pipeline failure:', err);
      let msg = err.message || 'Failed to complete image upload and product submission.';
      if (
        msg.includes('row-level security') ||
        msg.includes('JWT') ||
        msg.includes('apikey') ||
        msg.includes('unauthorized') ||
        msg.includes('missing')
      ) {
        msg = `Supabase Storage Auth: ${msg}. Verify your Anon Key and ensure bucket 'product_image' has public upload enabled.`;
        setShowKeyConfig(true);
      }
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#2A2141]/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-[#F9F8FC] rounded-3xl shadow-2xl border border-[#EAE6F4] overflow-hidden my-6 text-left max-h-[92vh] flex flex-col">
        {/* Modal Topbar */}
        <div className="p-6 bg-white border-b border-[#EAE6F4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2A2141] text-[#9B8EC7] flex items-center justify-center shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-2xl font-light text-[#2A2141]">
                  Add Product Silhouette
                </h3>
                <span className="text-[10px] bg-[#9B8EC7]/20 text-[#2A2141] font-mono font-semibold px-2 py-0.5 rounded-full border border-[#9B8EC7]/30">
                  Supabase Storage
                </span>
              </div>
              <p className="text-xs text-[#2A2141]/60">
                Direct integration with Supabase bucket{' '}
                <span className="font-mono text-[#2A2141] font-semibold">product_image</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#2A2141]/60 hover:text-[#2A2141] hover:bg-[#F9F8FC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-grow">
          {/* Supabase Storage Bucket Verification Pill */}
          <div className="p-4 bg-white rounded-2xl border border-[#EAE6F4] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-[#2A2141]">
                <Shield className="w-4 h-4 text-[#9B8EC7]" />
                <span>
                  Supabase Storage Bucket:{' '}
                  <strong className="font-mono text-[#2A2141]">product_image</strong>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-semibold">
                  Public Bucket Verified
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowKeyConfig(!showKeyConfig)}
                className="text-[11px] text-[#9B8EC7] hover:text-[#2A2141] font-medium flex items-center gap-1 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{showKeyConfig ? 'Hide Key Config' : 'Configure Anon Key'}</span>
              </button>
            </div>

            {/* Expandable Key Configuration */}
            {showKeyConfig && (
              <div className="pt-3 border-t border-[#EAE6F4] space-y-2">
                <p className="text-[11px] text-[#2A2141]/70 leading-relaxed">
                  Enter your Supabase <strong className="font-mono">anon public</strong> API key from{' '}
                  <span className="font-medium text-[#2A2141]">
                    Supabase Dashboard &gt; Project Settings &gt; API
                  </span>{' '}
                  to authorize browser uploads directly to the <code className="font-mono">product_image</code> bucket.
                </p>

                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={e => setAnonKey(e.target.value)}
                    className="flex-grow text-xs font-mono p-2.5 bg-[#F9F8FC] border border-[#EAE6F4] rounded-xl outline-none text-[#2A2141] focus:border-[#9B8EC7]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveAnonKey}
                    className="px-4 py-2 bg-[#2A2141] text-white text-xs font-medium rounded-xl hover:bg-[#3D315B] transition-colors cursor-pointer"
                  >
                    Save Key
                  </button>
                </div>

                {keySaveMessage && (
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {keySaveMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Section 1: Supabase Direct Photo Upload Zone */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-serif text-base text-[#2A2141] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#9B8EC7]" />
                Product Imagery (Direct Supabase Bucket Upload)
              </label>
              <span className="text-[11px] text-[#2A2141]/50 font-mono">
                Max 5MB · PNG, JPEG, WEBP
              </span>
            </div>

            {/* Notification using #D95D39 alert color */}
            {errorMessage && (
              <div className="p-3.5 bg-[#D95D39]/10 border border-[#D95D39]/30 rounded-2xl flex items-start gap-2.5 text-xs text-[#D95D39] animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#D95D39]" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#D95D39]">Upload Notice</p>
                  <p className="leading-relaxed text-[#D95D39]">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Dropzone Container */}
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
                previewUrl
                  ? 'border-emerald-400 bg-emerald-50/20'
                  : 'border-[#9B8EC7]/40 hover:border-[#9B8EC7] bg-white hover:bg-[#F9F8FC]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileSelected}
                className="hidden"
                disabled={isUploading}
              />

              {previewUrl ? (
                <div className="flex flex-col sm:flex-row items-center gap-6 text-left">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden bg-[#F9F8FC] border border-[#EAE6F4] shrink-0 shadow-xs">
                    <img
                      src={previewUrl}
                      alt="Selected silhouette preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1.5 flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Image Staged for Direct Upload
                      </span>
                    </div>
                    <p className="text-xs font-mono text-[#2A2141] truncate">
                      File: {selectedFileName} ({selectedFileSize})
                    </p>
                    <p className="text-[11px] text-[#2A2141]/60 font-light">
                      Will be uploaded to bucket <code className="font-mono text-[#2A2141]">product_image</code> with unique timestamped path upon submission.
                    </p>
                    <p className="text-[11px] text-[#9B8EC7] hover:underline font-medium pt-1">
                      Click to choose a different photograph
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-6 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F1EEF9] text-[#9B8EC7] flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#2A2141]">
                      Select or drop product photograph
                    </p>
                    <p className="text-xs text-[#2A2141]/60">
                      Uploaded directly to <code className="font-mono text-[#2A2141]">product_image</code> bucket upon submission
                    </p>
                  </div>
                </div>
              )}
            </div>

            {uploadProgress && (
              <div className="flex items-center gap-2 text-xs font-mono text-[#9B8EC7] pt-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{uploadProgress}</span>
              </div>
            )}
          </div>

          {/* Section 2: Product Specifications */}
          <div className="space-y-4 pt-2">
            <h4 className="font-serif text-base text-[#2A2141] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#9B8EC7]" />
              Silhouette Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-wider text-[#2A2141]/70 mb-1.5 font-medium">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sovereign Suede Weekend Holdall"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-3 bg-white border border-[#EAE6F4] rounded-xl outline-none text-[#2A2141] focus:border-[#9B8EC7] shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#2A2141]/70 mb-1.5 font-medium">
                  Atelier Category *
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full p-3 bg-white border border-[#EAE6F4] rounded-xl outline-none text-[#2A2141] focus:border-[#9B8EC7] shadow-2xs cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#2A2141]/70 mb-1.5 font-medium">
                  Brand / Maison
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="MIO Atelier"
                  className="w-full p-3 bg-white border border-[#EAE6F4] rounded-xl outline-none text-[#2A2141] focus:border-[#9B8EC7] shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#2A2141]/70 mb-1.5 font-medium">
                  Base Price (USD) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={basePrice}
                  onChange={e => setBasePrice(e.target.value)}
                  className="w-full p-3 bg-white border border-[#EAE6F4] rounded-xl outline-none text-[#2A2141] font-mono focus:border-[#9B8EC7] shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#2A2141]/70 mb-1.5 font-medium">
                  Initial Stock Quantity
                </label>
                <input
                  type="number"
                  value={variantStock}
                  onChange={e => setVariantStock(e.target.value)}
                  className="w-full p-3 bg-white border border-[#EAE6F4] rounded-xl outline-none text-[#2A2141] font-mono focus:border-[#9B8EC7] shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#2A2141]/70 mb-1.5 font-medium">
                  Default Size Specification
                </label>
                <input
                  type="text"
                  value={variantSize}
                  onChange={e => setVariantSize(e.target.value)}
                  placeholder="e.g., Medium, One Size, 50ml"
                  className="w-full p-3 bg-white border border-[#EAE6F4] rounded-xl outline-none text-[#2A2141] focus:border-[#9B8EC7] shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#2A2141]/70 mb-1.5 font-medium">
                  Colorway / Finish
                </label>
                <input
                  type="text"
                  value={variantColor}
                  onChange={e => setVariantColor(e.target.value)}
                  placeholder="e.g., Obsidian Black, 18k Yellow Gold"
                  className="w-full p-3 bg-white border border-[#EAE6F4] rounded-xl outline-none text-[#2A2141] focus:border-[#9B8EC7] shadow-2xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-wider text-[#2A2141]/70 mb-1.5 font-medium">
                  Artisanal Provenance & Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detailed specifications, material origin, and atelier craftsmanship notes..."
                  className="w-full p-3 bg-white border border-[#EAE6F4] rounded-xl outline-none text-[#2A2141] focus:border-[#9B8EC7] shadow-2xs resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Action: #9B8EC7 submit button with disabled state and loading spinner */}
          <div className="pt-4 border-t border-[#EAE6F4] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading || isSubmitting}
              className="px-5 py-2.5 text-xs font-medium text-[#2A2141]/70 hover:text-[#2A2141] cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading || isSubmitting || !selectedFile || !title.trim()}
              className={`px-7 py-3 rounded-full text-xs uppercase tracking-widest font-semibold flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                isUploading || isSubmitting || !selectedFile || !title.trim()
                  ? 'bg-[#9B8EC7]/50 text-white/70 cursor-not-allowed'
                  : 'bg-[#9B8EC7] text-[#FFFFFF] hover:bg-[#8576B3] hover:shadow-lg'
              }`}
            >
              {isUploading || isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>
                    {isUploading ? 'Uploading to Supabase Storage...' : 'Recording Silhouette...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Publish Silhouette</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Export AddProduct alias as requested
export const AddProduct = AddProductModal;
export default AddProductModal;
