import React, { useState, useRef } from 'react';
import {
  Plus,
  Edit2,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Upload,
} from 'lucide-react';
import { useTeaNestStore, formatCurrency, calculateLowStockThreshold } from '@tea-nest/shared';
import { Product } from '@tea-nest/types';

export const ProductsPage: React.FC = () => {
  const { state, store } = useTeaNestStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // File input refs for uploading directly from device
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [weight, setWeight] = useState(500);
  const [unit, setUnit] = useState<'g' | 'kg'>('g');
  const [sellingPrice, setSellingPrice] = useState(450);
  const [mrp, setMrp] = useState(499);
  const [purchasePrice, setPurchasePrice] = useState(220);
  const [hsnCode, setHsnCode] = useState('0902');
  const [gstRate, setGstRate] = useState(5);
  const [stockQuantity, setStockQuantity] = useState(100);
  const [stockReferenceQty, setStockReferenceQty] = useState(100);
  const [lowStockPercent, setLowStockPercent] = useState(70);
  const [description, setDescription] = useState('');

  // Image & Visibility states
  const [frontImageUrl, setFrontImageUrl] = useState('/images/tea_nest_front.jpg');
  const [backImageUrl, setBackImageUrl] = useState('/images/tea_nest_back.jpg');
  const [isPublished, setIsPublished] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const products = state.products;

  const showNotification = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  /**
   * Optimize and convert device image to compressed Data URL
   */
  const compressAndReadImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressed);
        };
        img.onerror = () => resolve(readerEvent.target?.result as string);
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDeviceImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (JPEG, PNG, WebP).');
      return;
    }

    if (type === 'front') setUploadingFront(true);
    else setUploadingBack(true);

    try {
      const dataUrl = await compressAndReadImage(file);
      if (type === 'front') {
        setFrontImageUrl(dataUrl);
      } else {
        setBackImageUrl(dataUrl);
      }
      showNotification(
        `Uploaded ${type === 'front' ? 'front packaging' : 'back packaging'} image from your device!`
      );
    } catch {
      alert('Failed to load image from device.');
    } finally {
      if (type === 'front') setUploadingFront(false);
      else setUploadingBack(false);
      e.target.value = ''; // reset so same file can be re-selected if needed
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSlug('');
    setSku('');
    setWeight(500);
    setUnit('g');
    setSellingPrice(450);
    setMrp(499);
    setPurchasePrice(220);
    setHsnCode('0902');
    setGstRate(5);
    setStockQuantity(100);
    setStockReferenceQty(100);
    setLowStockPercent(70);
    setDescription('Rich • Refreshing • Aromatic. Single-estate pure Assam black tea.');
    setFrontImageUrl('/images/tea_nest_front.jpg');
    setBackImageUrl('/images/tea_nest_back.jpg');
    setIsPublished(true);
    setIsActive(true);
    setIsFeatured(false);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSlug(p.slug);
    setSku(p.sku);
    setWeight(p.weight);
    setUnit(p.unit as any);
    setSellingPrice(p.sellingPrice);
    setMrp(p.mrp);
    setPurchasePrice(p.purchasePrice);
    setHsnCode(p.hsnCode);
    setGstRate(p.gstRate);
    setStockQuantity(p.stockQuantity);
    setStockReferenceQty(p.stockReferenceQty);
    setLowStockPercent(p.lowStockPercent || 70);
    setDescription(p.description);
    setFrontImageUrl(p.thumbnail?.secureUrl || p.images?.[0]?.secureUrl || '/images/tea_nest_front.jpg');
    setBackImageUrl(p.images?.[1]?.secureUrl || '/images/tea_nest_back.jpg');
    setIsPublished(p.isPublished ?? true);
    setIsActive(p.isActive ?? true);
    setIsFeatured(p.isFeatured ?? false);
    setModalOpen(true);
  };

  const handleTogglePublished = (p: Product) => {
    const nextVal = !p.isPublished;
    store.updateProduct(p.id, { isPublished: nextVal });
    showNotification(
      nextVal
        ? `"${p.name}" is now published and live on the storefront.`
        : `"${p.name}" is now hidden from the storefront.`
    );
  };

  const handleToggleActive = (p: Product) => {
    const nextVal = !p.isActive;
    store.updateProduct(p.id, { isActive: nextVal });
    showNotification(
      nextVal
        ? `"${p.name}" is marked as active in catalog.`
        : `"${p.name}" is archived.`
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmProduct) return;
    const prodName = deleteConfirmProduct.name;
    store.deleteProduct(deleteConfirmProduct.id);
    setDeleteConfirmProduct(null);
    showNotification(`Product "${prodName}" has been removed from catalog.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const threshold = calculateLowStockThreshold(stockReferenceQty, lowStockPercent);

    const images = [
      {
        cloudinaryPublicId: 'front',
        secureUrl: frontImageUrl.trim() || '/images/tea_nest_front.jpg',
        width: 800,
        height: 1200,
        altText: `${name} Front Packaging`,
        sortOrder: 1,
      },
      ...(backImageUrl.trim()
        ? [
            {
              cloudinaryPublicId: 'back',
              secureUrl: backImageUrl.trim(),
              width: 800,
              height: 1200,
              altText: `${name} Back Packaging`,
              sortOrder: 2,
            },
          ]
        : []),
    ];

    const thumbnail = {
      cloudinaryPublicId: 'front',
      secureUrl: frontImageUrl.trim() || '/images/tea_nest_front.jpg',
      width: 800,
      height: 1200,
      altText: `${name} Thumbnail`,
      sortOrder: 1,
    };

    if (editingProduct) {
      store.updateProduct(editingProduct.id, {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        sku,
        weight: Number(weight),
        unit,
        sellingPrice: Number(sellingPrice),
        mrp: Number(mrp),
        purchasePrice: Number(purchasePrice),
        hsnCode,
        gstRate: Number(gstRate),
        stockQuantity: Number(stockQuantity),
        stockReferenceQty: Number(stockReferenceQty),
        lowStockPercent: Number(lowStockPercent),
        lowStockThresholdQty: threshold,
        description,
        images,
        thumbnail,
        isPublished,
        isActive,
        isFeatured,
      });
      showNotification(`Product "${name}" updated successfully.`);
    } else {
      store.createProduct({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        sku: sku || `TN-${name.substring(0, 3).toUpperCase()}-500G`,
        categoryId: 'black-tea',
        categoryName: 'Black Tea',
        weight: Number(weight),
        unit,
        sellingPrice: Number(sellingPrice),
        mrp: Number(mrp),
        purchasePrice: Number(purchasePrice),
        hsnCode,
        gstRate: Number(gstRate),
        stockQuantity: Number(stockQuantity),
        stockReferenceQty: Number(stockReferenceQty),
        lowStockPercent: Number(lowStockPercent),
        lowStockThresholdQty: threshold,
        description,
        images,
        thumbnail,
        isPublished,
        isActive,
        isFeatured,
      });
      showNotification(`Product "${name}" created successfully.`);
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-100">Artisanal Tea Catalog</h1>
          <p className="text-xs text-admin-muted mt-1">
            Manage packaging imagery, storefront visibility rules, price structure, and atomic inventory stock thresholds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-admin-card hover:bg-admin-border border border-admin-border text-gray-300 text-xs font-semibold rounded-xl transition-colors"
          >
            <span>Preview Client Store</span>
            <ExternalLink className="w-3.5 h-3.5 text-admin-gold" />
          </a>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-admin-accent hover:bg-admin-gold text-black rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tea Product</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionFeedback && (
        <div className="p-3.5 bg-green-950/70 border border-green-800 text-green-200 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-admin-card text-admin-muted uppercase tracking-wider font-semibold border-b border-admin-border">
              <tr>
                <th className="p-4">Product & Packaging</th>
                <th className="p-4">SKU / GST</th>
                <th className="p-4">Weight</th>
                <th className="p-4">Selling / MRP</th>
                <th className="p-4">Unit Cost</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Low Stock Rule</th>
                <th className="p-4">Client Visibility</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {products.map((p) => {
                const threshold =
                  p.lowStockThresholdQty ||
                  calculateLowStockThreshold(p.stockReferenceQty, p.lowStockPercent || 70);
                const isAlert = p.stockQuantity < threshold;

                return (
                  <tr key={p.id} className="hover:bg-admin-card/50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="relative w-12 h-12 bg-charcoal-950 rounded-lg p-1 shrink-0 flex items-center justify-center border border-admin-border overflow-hidden">
                        <img
                          src={p.thumbnail?.secureUrl || '/images/tea_nest_front.jpg'}
                          alt={p.name}
                          className="max-h-full max-w-full object-contain"
                        />
                        {!p.isPublished && (
                          <div
                            title="Hidden from storefront"
                            className="absolute inset-0 bg-black/60 flex items-center justify-center"
                          >
                            <EyeOff className="w-4 h-4 text-amber-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-gray-200">{p.name}</p>
                          {p.isFeatured && (
                            <span className="px-1.5 py-0.2 bg-gold-900/60 text-gold-400 border border-gold-700/50 rounded text-[9px] font-bold">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-admin-gold font-serif italic">
                          {p.categoryName || 'Black Tea'}
                        </p>
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-gray-300">{p.sku}</p>
                      <p className="text-[11px] text-admin-muted">
                        HSN: {p.hsnCode} ({p.gstRate}% GST)
                      </p>
                    </td>

                    <td className="p-4 font-semibold text-gray-300">
                      {p.weight}{p.unit}
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-admin-gold">{formatCurrency(p.sellingPrice, false)}</p>
                      {p.mrp > p.sellingPrice && (
                        <p className="text-[11px] text-admin-muted line-through">
                          {formatCurrency(p.mrp, false)}
                        </p>
                      )}
                    </td>

                    <td className="p-4 text-gray-300">{formatCurrency(p.purchasePrice, false)}</td>

                    <td className="p-4">
                      <span
                        className={`font-bold ${
                          isAlert ? 'text-red-400 flex items-center gap-1' : 'text-green-400'
                        }`}
                      >
                        {isAlert && <AlertTriangle className="w-3.5 h-3.5" />}
                        {p.stockQuantity} units
                      </span>
                    </td>

                    <td className="p-4 text-admin-muted">
                      <span className="font-medium text-gray-300">
                        {threshold} units ({p.lowStockPercent || 70}% of {p.stockReferenceQty})
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                            p.isPublished
                              ? 'bg-green-950 text-green-400 border border-green-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {p.isPublished ? (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Live on Store</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>Hidden</span>
                            </>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          className={`text-[9px] font-medium transition-colors hover:underline text-left cursor-pointer ${
                            p.isActive ? 'text-gray-400 hover:text-white' : 'text-red-400 hover:text-red-300'
                          }`}
                          title={p.isActive ? 'Click to Archive' : 'Click to Activate'}
                        >
                          {p.isActive ? 'Active Catalog' : 'Archived'}
                        </button>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick visibility toggle */}
                        <button
                          onClick={() => handleTogglePublished(p)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            p.isPublished
                              ? 'bg-admin-card hover:bg-admin-border border-admin-border text-gray-300 hover:text-white'
                              : 'bg-amber-950/60 hover:bg-amber-900/80 border-amber-800 text-amber-300'
                          }`}
                          title={p.isPublished ? 'Click to Hide from Storefront' : 'Click to View / Publish on Storefront'}
                        >
                          {p.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        {/* Edit modal */}
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 bg-admin-card hover:bg-admin-border border border-admin-border text-admin-gold rounded-lg transition-colors"
                          title="Edit Product & Imagery"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete product */}
                        <button
                          onClick={() => setDeleteConfirmProduct(p)}
                          className="p-1.5 bg-admin-card hover:bg-red-950/70 border border-admin-border hover:border-red-800 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                          title="Remove Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-admin-surface border border-admin-border rounded-2xl p-6 text-gray-100 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-red-400">
              Remove Product from Catalog?
            </h3>
            <p className="text-xs text-admin-muted leading-relaxed">
              Are you sure you want to permanently remove{' '}
              <strong className="text-gray-200">{deleteConfirmProduct.name}</strong> (SKU:{' '}
              {deleteConfirmProduct.sku})? It will be removed from both the client storefront and admin inventory ledger.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 bg-admin-card hover:bg-admin-border text-gray-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow"
              >
                Yes, Remove Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal (Compact, Viewport-Constrained & Responsive) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm">
          {/* Hidden File Inputs for Device Upload */}
          <input
            type="file"
            ref={frontFileInputRef}
            accept="image/*"
            onChange={(e) => handleDeviceImageUpload(e, 'front')}
            className="hidden"
          />
          <input
            type="file"
            ref={backFileInputRef}
            accept="image/*"
            onChange={(e) => handleDeviceImageUpload(e, 'back')}
            className="hidden"
          />

          <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-admin-surface border border-admin-border rounded-2xl flex flex-col text-gray-100 shadow-2xl overflow-hidden">
            {/* Sticky Header */}
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-admin-border bg-admin-surface shrink-0">
              <div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-gray-100">
                  {editingProduct ? `Edit ${editingProduct.name}` : 'Add New Tea Product'}
                </h3>
                <p className="text-[10px] text-admin-muted">
                  Configure packaging imagery, storefront visibility, and inventory thresholds.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-admin-card transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="productModalForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* Product Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1 text-[11px]">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Assam Black Tea"
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1 text-[11px]">
                    SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. TN-ABT-500G"
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
              </div>

              {/* Price & Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1 text-[11px]">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1 text-[11px]">
                    MRP (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={mrp}
                    onChange={(e) => setMrp(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1 text-[11px]">
                    Unit Cost (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
              </div>

              {/* Weight, HSN, GST */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1 text-[11px]">
                    Weight ({unit}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1 text-[11px]">
                    HSN Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1 text-[11px]">
                    GST Rate (%) *
                  </label>
                  <input
                    type="number"
                    required
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
              </div>

              {/* ======================================================== */}
              {/* Product Imagery Section (Device Upload + URL + Preview) */}
              {/* ======================================================== */}
              <div className="p-3.5 bg-admin-card rounded-xl border border-admin-border space-y-3">
                <span className="font-bold text-admin-gold uppercase text-[11px] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Packaging Imagery (Upload from Device or specify URL)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Front Packaging Image */}
                  <div className="p-3 bg-admin-bg rounded-lg border border-admin-border space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-200 text-xs">Front Pouch Image *</span>
                      <button
                        type="button"
                        onClick={() => setFrontImageUrl('/images/tea_nest_front.jpg')}
                        className="text-[10px] text-admin-gold hover:underline"
                      >
                        Reset Default
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-charcoal-950 rounded-lg border border-admin-border overflow-hidden p-1 flex items-center justify-center shrink-0">
                        <img
                          src={frontImageUrl || '/images/tea_nest_front.jpg'}
                          alt="Front Packaging Preview"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/tea_nest_front.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <button
                          type="button"
                          disabled={uploadingFront}
                          onClick={() => frontFileInputRef.current?.click()}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-admin-accent/20 hover:bg-admin-accent/30 text-admin-gold border border-admin-gold/40 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingFront ? 'Loading Image...' : 'Upload from Device'}</span>
                        </button>
                        <p className="text-[10px] text-admin-muted truncate">
                          PNG, JPG, WebP supported
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-admin-muted mb-0.5">
                        Or Image URL / Path:
                      </label>
                      <input
                        type="text"
                        value={frontImageUrl}
                        onChange={(e) => setFrontImageUrl(e.target.value)}
                        placeholder="/images/tea_nest_front.jpg"
                        className="w-full px-2.5 py-1.5 bg-admin-surface border border-admin-border rounded-lg text-[11px] text-gray-200 outline-none focus:border-admin-accent"
                      />
                    </div>
                  </div>

                  {/* Back Packaging Image */}
                  <div className="p-3 bg-admin-bg rounded-lg border border-admin-border space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-200 text-xs">Back Label Image (Optional)</span>
                      <button
                        type="button"
                        onClick={() => setBackImageUrl('/images/tea_nest_back.jpg')}
                        className="text-[10px] text-admin-gold hover:underline"
                      >
                        Reset Default
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-charcoal-950 rounded-lg border border-admin-border overflow-hidden p-1 flex items-center justify-center shrink-0">
                        <img
                          src={backImageUrl || '/images/tea_nest_back.jpg'}
                          alt="Back Packaging Preview"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/tea_nest_back.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <button
                          type="button"
                          disabled={uploadingBack}
                          onClick={() => backFileInputRef.current?.click()}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-admin-accent/20 hover:bg-admin-accent/30 text-admin-gold border border-admin-gold/40 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingBack ? 'Loading Image...' : 'Upload from Device'}</span>
                        </button>
                        <p className="text-[10px] text-admin-muted truncate">
                          PNG, JPG, WebP supported
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-admin-muted mb-0.5">
                        Or Image URL / Path:
                      </label>
                      <input
                        type="text"
                        value={backImageUrl}
                        onChange={(e) => setBackImageUrl(e.target.value)}
                        placeholder="/images/tea_nest_back.jpg"
                        className="w-full px-2.5 py-1.5 bg-admin-surface border border-admin-border rounded-lg text-[11px] text-gray-200 outline-none focus:border-admin-accent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* Storefront Rules & Visibility Controls                   */}
              {/* ======================================================== */}
              <div className="p-3.5 bg-admin-card rounded-xl border border-admin-border space-y-2.5">
                <span className="font-bold text-admin-gold uppercase text-[11px] block">
                  Storefront Visibility & Rules
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Is Published */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-admin-bg border border-admin-border cursor-pointer hover:border-admin-accent/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="mt-0.5 rounded accent-green-500"
                    />
                    <div>
                      <span className="font-bold text-gray-200 block text-[11px]">
                        Publish on Storefront
                      </span>
                      <span className="text-[10px] text-admin-muted">
                        {isPublished ? 'Live for shoppers' : 'Hidden from storefront'}
                      </span>
                    </div>
                  </label>

                  {/* Is Active */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-admin-bg border border-admin-border cursor-pointer hover:border-admin-accent/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="mt-0.5 rounded accent-blue-500"
                    />
                    <div>
                      <span className="font-bold text-gray-200 block text-[11px]">
                        Active Catalog Status
                      </span>
                      <span className="text-[10px] text-admin-muted">
                        {isActive ? 'Available for orders' : 'Archived'}
                      </span>
                    </div>
                  </label>

                  {/* Is Featured */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-admin-bg border border-admin-border cursor-pointer hover:border-admin-accent/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="mt-0.5 rounded accent-amber-500"
                    />
                    <div>
                      <span className="font-bold text-gray-200 block text-[11px]">
                        Feature on Homepage
                      </span>
                      <span className="text-[10px] text-admin-muted">
                        {isFeatured ? 'Flagship Bestseller' : 'Standard listing'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Low Stock Threshold Formula Section */}
              <div className="p-3.5 bg-admin-card rounded-xl border border-admin-border space-y-2.5">
                <span className="font-bold text-admin-gold uppercase text-[11px] block">
                  Inventory & Threshold: ceil(StockReferenceQty × LowStock% ÷ 100)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-admin-muted mb-1 text-[11px]">
                      Current Stock Qty
                    </label>
                    <input
                      type="number"
                      required
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-admin-muted mb-1 text-[11px]">
                      Stock Reference Qty
                    </label>
                    <input
                      type="number"
                      required
                      value={stockReferenceQty}
                      onChange={(e) => setStockReferenceQty(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-admin-muted mb-1 text-[11px]">
                      Low Stock % (Default 70)
                    </label>
                    <input
                      type="number"
                      required
                      value={lowStockPercent}
                      onChange={(e) => setLowStockPercent(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">
                  Calculated Threshold:{' '}
                  <strong className="text-white">
                    {calculateLowStockThreshold(stockReferenceQty, lowStockPercent)} units
                  </strong>
                  . Low Stock Alert triggers when stock falls below this number.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1 text-[11px]">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                />
              </div>
            </form>

            {/* Sticky Modal Footer (Always Visible on all window/mobile viewports) */}
            <div className="px-5 py-3 border-t border-admin-border bg-admin-card flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-admin-surface hover:bg-admin-border text-gray-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="productModalForm"
                className="px-5 py-2 bg-admin-accent hover:bg-admin-gold text-black rounded-lg text-xs font-bold shadow transition-all cursor-pointer"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
