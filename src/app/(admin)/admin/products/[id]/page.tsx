'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Trash2, Upload, X, Save, Loader } from 'lucide-react';
import { doc, getDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/client';
import { productsCol } from '@/lib/firebase/firestore';
import { slugify, productSchema } from '@/lib/utils';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { v4 as uuid } from 'uuid';
import Link from 'next/link';

type FormData = z.infer<typeof productSchema>;

const CATEGORIES  = ['Dresses','Tops','Bottoms','Outerwear','Accessories','Swimwear'];
const COLLECTIONS = ['summer-luxe','essentials','evening-edit','resort','autumn'];
const SIZES       = ['XS','S','M','L','XL','XXL','One Size'];
const COLORS      = [
  { name:'Ivory',    hex:'#f5f0e8' },{ name:'Black',    hex:'#0a0a0a' },
  { name:'Camel',    hex:'#c9a96e' },{ name:'Blush',    hex:'#e8b4a0' },
  { name:'Sand',     hex:'#e8ddd0' },{ name:'Navy',     hex:'#1a2744' },
  { name:'White',    hex:'#fafaf8' },{ name:'Sage',     hex:'#87a888' },
  { name:'Charcoal', hex:'#3a3a3a' },{ name:'Champagne',hex:'#e8c98a' },
];

export default function ProductFormPage() {
  const params    = useParams();
  const router    = useRouter();
  const isEdit    = params.id !== 'new';
  const productId = isEdit ? params.id as string : null;

  const [images,       setImages]       = useState<string[]>([]);
  const [uploading,    setUploading]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [loading,      setLoading]      = useState(isEdit);
  const [details,      setDetails]      = useState<string[]>(['']);

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { isActive:true, isFeatured:false, isNew:true, isBestSeller:false, tags:[] },
  });

  const { fields: variants, append: addVariant, remove: removeVariant } = useFieldArray({ control, name: 'tags' as any });

  const [variantRows, setVariantRows] = useState([{ id:uuid(), size:'M', color:'Black', colorHex:'#0a0a0a', sku:'', stock:10, priceAdjustment:0 }]);

  useEffect(() => {
    if (!isEdit || !productId) return;
    getDoc(doc(db,'products',productId)).then(snap => {
      if (!snap.exists()) return;
      const d = snap.data() as any;
      setValue('name', d.name); setValue('description', d.description);
      setValue('price', d.price); setValue('comparePrice', d.comparePrice);
      setValue('categoryId', d.categoryId); setValue('collection', d.collection);
      setValue('isActive', d.isActive); setValue('isFeatured', d.isFeatured);
      setValue('isNew', d.isNew); setValue('isBestSeller', d.isBestSeller);
      setValue('tags', d.tags || []);
      setImages(d.images || []);
      setDetails(d.details || ['']);
      if (d.variants?.length) setVariantRows(d.variants);
      setLoading(false);
    });
  }, [isEdit, productId, setValue]);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        // Upload to Firebase Storage (replace with Cloudinary if preferred)
        const storageRef = ref(storage, `products/${uuid()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        urls.push(url);
      }
      setImages(prev => [...prev, ...urls]);
      toast.success(`${urls.length} image(s) uploaded`);
    } catch { toast.error('Image upload failed'); }
    finally { setUploading(false); }
  };

  const onSubmit = async (data: FormData) => {
    if (images.length === 0) { toast.error('Please add at least one image'); return; }
    setSaving(true);
    try {
      const inventory: Record<string, number> = {};
      variantRows.forEach(v => { inventory[v.sku] = v.stock; });

      const payload = {
        ...data,
        slug: slugify(data.name),
        images,
        details: details.filter(d => d.trim()),
        variants: variantRows.map(v => ({ ...v, id: v.id || uuid() })),
        inventory,
        ratings: { avg: 0, count: 0 },
        updatedAt: serverTimestamp(),
      };

      if (isEdit && productId) {
        await setDoc(doc(db,'products',productId), payload, { merge:true });
        toast.success('Product updated!');
      } else {
        await addDoc(productsCol, { ...payload, createdAt: serverTimestamp() });
        toast.success('Product created!');
      }
      router.push('/admin/products');
    } catch (e) { console.error(e); toast.error('Failed to save product'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-10 flex items-center justify-center min-h-96"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 rounded-lg border border-admin-border text-admin-muted hover:text-admin-text hover:border-admin-text/30 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-light text-admin-text">{isEdit ? 'Edit Product' : 'New Product'}</h1>
            <p className="text-admin-muted text-sm">{isEdit ? 'Update product details' : 'Add a new product to your store'}</p>
          </div>
        </div>
        <button onClick={handleSubmit(onSubmit)} disabled={saving}
          className="btn-primary bg-gold text-black hover:bg-gold-light text-xs py-2.5 disabled:opacity-60">
          {saving ? <><Loader size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> {isEdit ? 'Update' : 'Publish'}</>}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Basic info */}
          <div className="admin-card space-y-4">
            <h2 className="text-admin-text font-medium">Basic Information</h2>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Product Name *</label>
              <input {...register('name')} className="admin-input" placeholder="e.g. Silk Drape Midi Dress" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Description *</label>
              <textarea {...register('description')} rows={5} className="admin-input resize-none" placeholder="Describe the product…" />
              {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Product Details (one per line)</label>
              {details.map((d, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={d} onChange={e => { const nd=[...details]; nd[i]=e.target.value; setDetails(nd); }}
                    className="admin-input flex-1" placeholder={`Detail ${i+1}, e.g. 100% Pure Silk`} />
                  <button type="button" onClick={() => setDetails(details.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-300">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setDetails([...details,''])}
                className="text-[11px] text-gold hover:text-gold-light flex items-center gap-1 mt-1">
                <Plus size={12} /> Add detail
              </button>
            </div>
          </div>

          {/* Images */}
          <div className="admin-card space-y-4">
            <h2 className="text-admin-text font-medium">Images</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((url, i) => (
                <div key={i} className="relative aspect-[3/4] bg-admin-bg border border-admin-border overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImages(images.filter((_,j)=>j!==i))}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} />
                  </button>
                  {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-white px-1.5 py-0.5">Main</span>}
                </div>
              ))}
              <label className={`aspect-[3/4] border-2 border-dashed border-admin-border hover:border-gold/50 flex flex-col items-center justify-center cursor-pointer transition-colors ${uploading ? 'opacity-50' : ''}`}>
                {uploading ? <Loader size={20} className="text-gold animate-spin" /> : <><Upload size={20} className="text-admin-muted mb-2" /><span className="text-[10px] text-admin-muted">Upload</span></>}
                <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(e.target.files)} disabled={uploading} />
              </label>
            </div>
            <p className="text-[11px] text-admin-muted">Upload to Firebase Storage. Replace with Cloudinary by changing the upload handler.</p>
          </div>

          {/* Variants */}
          <div className="admin-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-admin-text font-medium">Variants (Size × Colour)</h2>
              <button type="button" onClick={() => setVariantRows([...variantRows, { id:uuid(), size:'M', color:'Black', colorHex:'#0a0a0a', sku:'', stock:10, priceAdjustment:0 }])}
                className="text-[11px] text-gold flex items-center gap-1 hover:text-gold-light">
                <Plus size={12} /> Add variant
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-admin-border">
                    {['Size','Colour','SKU','Stock','Price Adj.',''].map(h => (
                      <th key={h} className="text-left pb-2 text-[10px] text-admin-muted uppercase tracking-wider pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border/30">
                  {variantRows.map((v, i) => (
                    <tr key={v.id}>
                      <td className="py-2 pr-2">
                        <select value={v.size} onChange={e => { const r=[...variantRows]; r[i]={...r[i],size:e.target.value}; setVariantRows(r); }} className="admin-input text-xs py-1.5">
                          {SIZES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <select value={v.color} onChange={e => {
                          const col = COLORS.find(c=>c.name===e.target.value);
                          const r=[...variantRows]; r[i]={...r[i],color:e.target.value,colorHex:col?.hex||'#000'}; setVariantRows(r);
                        }} className="admin-input text-xs py-1.5">
                          {COLORS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <input value={v.sku} onChange={e => { const r=[...variantRows]; r[i]={...r[i],sku:e.target.value}; setVariantRows(r); }}
                          className="admin-input text-xs py-1.5 w-28" placeholder="VLT-001-M-BLK" />
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" value={v.stock} onChange={e => { const r=[...variantRows]; r[i]={...r[i],stock:Number(e.target.value)}; setVariantRows(r); }}
                          className="admin-input text-xs py-1.5 w-20" min={0} />
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" value={v.priceAdjustment} onChange={e => { const r=[...variantRows]; r[i]={...r[i],priceAdjustment:Number(e.target.value)}; setVariantRows(r); }}
                          className="admin-input text-xs py-1.5 w-20" />
                      </td>
                      <td className="py-2">
                        <button type="button" onClick={() => setVariantRows(variantRows.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-300">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Status & flags */}
          <div className="admin-card space-y-3">
            <h2 className="text-admin-text font-medium mb-3">Status & Flags</h2>
            {[
              { key:'isActive',     label:'Published',  desc:'Visible in store' },
              { key:'isFeatured',   label:'Featured',   desc:'Show on homepage' },
              { key:'isNew',        label:'New Arrival', desc:'New badge' },
              { key:'isBestSeller', label:'Bestseller',  desc:'Bestseller badge' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm text-admin-text">{label}</p>
                  <p className="text-xs text-admin-muted">{desc}</p>
                </div>
                <input type="checkbox" {...register(key as any)} className="w-4 h-4 accent-gold" />
              </label>
            ))}
          </div>

          {/* Pricing */}
          <div className="admin-card space-y-3">
            <h2 className="text-admin-text font-medium">Pricing (PKR)</h2>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Price *</label>
              <input {...register('price', { valueAsNumber:true })} type="number" className="admin-input" placeholder="18500" />
              {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Compare Price</label>
              <input {...register('comparePrice', { valueAsNumber:true })} type="number" className="admin-input" placeholder="22000 (original price)" />
            </div>
          </div>

          {/* Organisation */}
          <div className="admin-card space-y-3">
            <h2 className="text-admin-text font-medium">Organisation</h2>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Category *</label>
              <select {...register('categoryId')} className="admin-input">
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.categoryId && <p className="text-red-400 text-xs mt-1">{errors.categoryId.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Collection *</label>
              <select {...register('collection')} className="admin-input">
                <option value="">Select…</option>
                {COLLECTIONS.map(c => <option key={c} value={c}>{c.replace('-',' ')}</option>)}
              </select>
              {errors.collection && <p className="text-red-400 text-xs mt-1">{errors.collection.message}</p>}
            </div>
          </div>

          {/* Tags */}
          <div className="admin-card">
            <h2 className="text-admin-text font-medium mb-3">Tags</h2>
            <TagInput value={watch('tags') || []} onChange={v => setValue('tags', v)} />
          </div>
        </div>
      </form>
    </div>
  );
}

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim().toLowerCase();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput('');
  };
  return (
    <div>
      <div className="flex gap-2 mb-2 flex-wrap">
        {value.map(t => (
          <span key={t} className="flex items-center gap-1 text-[11px] bg-gold/10 text-gold px-2.5 py-1 rounded-full">
            {t}<button type="button" onClick={() => onChange(value.filter(x=>x!==t))}><X size={10} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),add())}
          className="admin-input flex-1 text-xs py-2" placeholder="Type tag and press Enter" />
        <button type="button" onClick={add} className="text-xs px-3 border border-admin-border text-admin-muted hover:text-gold hover:border-gold/30 rounded-lg transition-colors">Add</button>
      </div>
    </div>
  );
}
