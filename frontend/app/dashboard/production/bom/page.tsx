'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

type Product = {
  id: number;
  name: string;
  code: string;
  unit: string;
  standard_batch_size: number;
  status: string;
};

type InventoryItem = {
  id: number;
  name: string;
  code: string;
  unit: string;
  current_stock: number;
  type: string;
};

type RawMaterial = {
  id: number;
  inventory_item_id: number;
  status: string;
  inventory_item?: InventoryItem;
  inventoryItem?: InventoryItem;
};

type BomItem = {
  id: number;
  material_id: number;
  quantity: number;
  unit: string;
  material?: RawMaterial;
};

type BomHeader = {
  id: number;
  product_id: number;
  version: string;
  batch_size: number;
  notes?: string | null;
  product?: Product;
  items: BomItem[];
};

type RequirementRow = {
  material_id: number;
  material_name: string;
  material_code: string;
  inventory_item_id: number;
  unit: string;
  required_quantity: number;
  available_stock: number;
  shortage: number;
};

type CalculationResult = {
  bom_id: number;
  batch_size: number;
  production_quantity: number;
  multiplier: number;
  requirements: RequirementRow[];
};

const toNumber = (value: string, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const extractList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const toCodeBase = (value: string): string => {
  const cleaned = String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'PRD';

  const compact = cleaned.replace(/\s+/g, '-');
  return compact.slice(0, 16) || 'PRD';
};

const buildUniqueProductCode = (name: string, existingCodes: string[]): string => {
  const base = toCodeBase(name);
  const used = new Set(existingCodes.map((code) => String(code || '').toUpperCase()));

  if (!used.has(base)) return base;

  let index = 1;
  while (index <= 9999) {
    const candidate = `${base}-${String(index).padStart(3, '0')}`;
    if (!used.has(candidate)) return candidate;
    index += 1;
  }

  return `${base}-${Date.now().toString().slice(-5)}`;
};

export default function BomPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryRawItems, setInventoryRawItems] = useState<InventoryItem[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [boms, setBoms] = useState<BomHeader[]>([]);

  const [newProductName, setNewProductName] = useState('');
  const [newProductCode, setNewProductCode] = useState('');
  const [productCodeAutoMode, setProductCodeAutoMode] = useState(true);
  const [newProductUnit, setNewProductUnit] = useState('pcs');
  const [newProductBatchSize, setNewProductBatchSize] = useState('1');
  const [newProductDescription, setNewProductDescription] = useState('');

  const [selectedInventoryMaterialId, setSelectedInventoryMaterialId] = useState<number>(0);

  const [bomProductId, setBomProductId] = useState<number>(0);
  const [bomVersion, setBomVersion] = useState('v1');
  const [bomBatchSize, setBomBatchSize] = useState('1');
  const [bomNotes, setBomNotes] = useState('');
  const [bomLines, setBomLines] = useState<Array<{ material_id: number; quantity: string; unit: string }>>([
    { material_id: 0, quantity: '1', unit: '' },
  ]);

  const [selectedBomId, setSelectedBomId] = useState<number>(0);
  const [productionQty, setProductionQty] = useState('1');
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [startingProduction, setStartingProduction] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  const inputClass =
    'w-full rounded-xl border border-emerald-100 bg-white/95 px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition-all duration-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 focus:outline-none';

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken || storedToken === 'undefined' || storedToken === 'null') {
      router.push('/');
      return;
    }
    setToken(storedToken);
  }, [router]);

  const authHeaders = (authToken: string) => ({ Authorization: `Bearer ${authToken}` });

  const loadData = async (authToken: string) => {
    try {
      setLoading(true);
      setMessage('');

      const [productsRes, rawRes, bomsRes, stockRes] = await Promise.all([
        axios.get(`${API_URL}/api/production/products`, { headers: authHeaders(authToken) }),
        axios.get(`${API_URL}/api/production/raw-materials`, { headers: authHeaders(authToken) }),
        axios.get(`${API_URL}/api/production/boms`, { headers: authHeaders(authToken) }),
        axios.get(`${API_URL}/api/stock/inventory`, {
          headers: authHeaders(authToken),
          params: { type: 'raw_material', per_page: 500 },
        }),
      ]);

      setProducts(extractList(productsRes.data));
      setRawMaterials(extractList(rawRes.data));
      setBoms(extractList(bomsRes.data));
      setInventoryRawItems(extractList(stockRes.data));
    } catch (error: any) {
      console.error('Failed to load BOM setup data:', error);
      if (error?.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/');
        return;
      }
      setMessage(error?.response?.data?.message || 'Failed to load BOM data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadData(token);
  }, [token]);

  const selectedBom = useMemo(() => boms.find((bom) => bom.id === selectedBomId) || null, [boms, selectedBomId]);

  useEffect(() => {
    if (!productCodeAutoMode) return;

    const generated = buildUniqueProductCode(
      newProductName,
      products.map((product) => product.code)
    );

    setNewProductCode(generated);
  }, [newProductName, products, productCodeAutoMode]);

  const addBomLine = () => {
    setBomLines((prev) => [...prev, { material_id: 0, quantity: '1', unit: '' }]);
  };

  const removeBomLine = (index: number) => {
    setBomLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateBomLine = (index: number, patch: Partial<{ material_id: number; quantity: string; unit: string }>) => {
    setBomLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const handleCreateProduct = async () => {
    if (!token) return;
    if (!newProductName.trim() || !newProductCode.trim()) {
      alert('Product name and code are required.');
      return;
    }

    try {
      setSaving(true);
      await axios.post(
        `${API_URL}/api/production/products`,
        {
          name: newProductName.trim(),
          code: newProductCode.trim(),
          unit: newProductUnit.trim() || 'pcs',
          standard_batch_size: toNumber(newProductBatchSize, 1),
          description: newProductDescription.trim() || null,
        },
        { headers: authHeaders(token) }
      );

      setNewProductName('');
      setNewProductCode('');
      setProductCodeAutoMode(true);
      setNewProductUnit('pcs');
      setNewProductBatchSize('1');
      setNewProductDescription('');
      setMessage('Finished product created successfully.');
      await loadData(token);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || 'Failed to create product.';
      const firstError = Object.values(error?.response?.data?.errors || {})?.[0] as string[] | undefined;
      alert(firstError?.[0] || apiMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRawMaterial = async () => {
    if (!token) return;
    if (!selectedInventoryMaterialId) {
      alert('Please select a raw material from inventory.');
      return;
    }

    try {
      setSaving(true);
      await axios.post(
        `${API_URL}/api/production/raw-materials`,
        { inventory_item_id: selectedInventoryMaterialId },
        { headers: authHeaders(token) }
      );
      setSelectedInventoryMaterialId(0);
      setMessage('Raw material added for BOM usage.');
      await loadData(token);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || 'Failed to add raw material.';
      const firstError = Object.values(error?.response?.data?.errors || {})?.[0] as string[] | undefined;
      alert(firstError?.[0] || apiMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBom = async () => {
    if (!token) return;
    if (!bomProductId) {
      alert('Please select product.');
      return;
    }

    const payloadLines = bomLines
      .filter((line) => line.material_id > 0 && toNumber(line.quantity, 0) > 0)
      .map((line) => ({
        material_id: line.material_id,
        quantity: toNumber(line.quantity, 0),
        unit: line.unit || null,
      }));

    if (payloadLines.length === 0) {
      alert('Add at least one BOM material line.');
      return;
    }

    try {
      setSaving(true);
      await axios.post(
        `${API_URL}/api/production/boms`,
        {
          product_id: bomProductId,
          version: bomVersion.trim() || 'v1',
          batch_size: toNumber(bomBatchSize, 1),
          notes: bomNotes.trim() || null,
          items: payloadLines,
        },
        { headers: authHeaders(token) }
      );

      setBomVersion('v1');
      setBomBatchSize('1');
      setBomNotes('');
      setBomLines([{ material_id: 0, quantity: '1', unit: '' }]);
      setMessage('BOM recipe created successfully.');
      await loadData(token);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || 'Failed to create BOM.';
      const firstError = Object.values(error?.response?.data?.errors || {})?.[0] as string[] | undefined;
      alert(firstError?.[0] || apiMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCalculateRequirements = async () => {
    if (!token || !selectedBomId) {
      alert('Select a BOM first.');
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/api/production/boms/calculate-materials`,
        {
          bom_id: selectedBomId,
          production_quantity: toNumber(productionQty, 0),
        },
        { headers: authHeaders(token) }
      );

      setCalculation(res.data?.data || null);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || 'Failed to calculate requirements.';
      const firstError = Object.values(error?.response?.data?.errors || {})?.[0] as string[] | undefined;
      alert(firstError?.[0] || apiMessage);
    }
  };

  const handleStartProduction = async () => {
    if (!token || !selectedBomId) {
      alert('Select a BOM first.');
      return;
    }

    try {
      setStartingProduction(true);
      await axios.post(
        `${API_URL}/api/production/orders/start`,
        {
          bom_id: selectedBomId,
          production_quantity: toNumber(productionQty, 0),
          notes: 'Started from BOM Formula Management screen',
        },
        { headers: authHeaders(token) }
      );
      setMessage('Production started and materials deducted from raw material inventory.');
      setCalculation(null);
      await loadData(token);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || 'Failed to start production.';
      const firstError = Object.values(error?.response?.data?.errors || {})?.[0] as string[] | undefined;
      alert(firstError?.[0] || apiMessage);
    } finally {
      setStartingProduction(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <nav className="relative z-10 bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Formula Management - BOM</h1>
              <p className="text-xs text-gray-600">Create products, define ingredients, and run batch calculations</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/production"
                className="px-4 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-md text-sm font-medium hover:bg-emerald-100"
              >
                Back to Production
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-5 py-2 rounded-full text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {message && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-white/60 bg-white/85 backdrop-blur-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">Finished Products</div>
            <div className="text-2xl font-bold text-gray-900">{products.length}</div>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/85 backdrop-blur-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">Raw Materials</div>
            <div className="text-2xl font-bold text-gray-900">{rawMaterials.length}</div>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/85 backdrop-blur-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">BOM Recipes</div>
            <div className="text-2xl font-bold text-gray-900">{boms.length}</div>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/85 backdrop-blur-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">Inventory Ingredients</div>
            <div className="text-2xl font-bold text-gray-900">{inventoryRawItems.length}</div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-lg shadow-xl p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Finished Product</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Finished Product Name</label>
                <input value={newProductName} onChange={(e) => setNewProductName(e.target.value)} className={inputClass} placeholder="e.g. Milk Toffee" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Finished Product Code</label>
                <div className="flex items-center gap-2">
                  <input
                    value={newProductCode}
                    onChange={(e) => {
                      setNewProductCode(e.target.value.toUpperCase());
                      setProductCodeAutoMode(false);
                    }}
                    className={inputClass}
                    placeholder="Product Code (auto generated)"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProductCodeAutoMode(true);
                      setNewProductCode(buildUniqueProductCode(newProductName, products.map((product) => product.code)));
                    }}
                    className="shrink-0 h-[42px] px-3 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100"
                  >
                    Auto
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  {productCodeAutoMode ? 'Code auto-generates from product name.' : 'Manual mode active. Click Auto to re-generate.'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Unit</label>
                <input value={newProductUnit} onChange={(e) => setNewProductUnit(e.target.value)} className={inputClass} placeholder="e.g. pcs, kg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Standard Batch Size</label>
                <input type="number" min="0" step="0.001" value={newProductBatchSize} onChange={(e) => setNewProductBatchSize(e.target.value)} className={inputClass} placeholder="e.g. 100" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Description (Optional)</label>
                <input value={newProductDescription} onChange={(e) => setNewProductDescription(e.target.value)} className={inputClass} placeholder="Short description for this finished product" />
              </div>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={handleCreateProduct}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-md text-sm font-medium hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
            >
              Add Product
            </button>
          </section>

          <section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-lg shadow-xl p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage Raw Materials</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Select From Inventory (Raw Materials)</label>
                <select
                  value={selectedInventoryMaterialId}
                  onChange={(e) => setSelectedInventoryMaterialId(Number(e.target.value))}
                  className={inputClass}
                >
                  <option value={0}>Choose inventory material</option>
                  {inventoryRawItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.name} ({Number(item.current_stock || 0).toFixed(2)} {item.unit})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={handleAddRawMaterial}
                className="h-[42px] px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-md text-sm font-medium hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50"
              >
                Add Ingredient
              </button>
            </div>

            <div className="mt-4 max-h-48 overflow-auto rounded-md border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {rawMaterials.length === 0 ? (
                    <tr><td colSpan={2} className="px-3 py-4 text-center text-sm text-gray-500">No raw materials mapped yet.</td></tr>
                  ) : (
                    rawMaterials.map((mat) => {
                      const inv = mat.inventoryItem || mat.inventory_item;
                      return (
                        <tr key={mat.id}>
                          <td className="px-3 py-2 text-sm text-gray-800">{inv?.code || '-'} - {inv?.name || '-'}</td>
                          <td className="px-3 py-2 text-sm text-right text-gray-700">{Number(inv?.current_stock || 0).toFixed(2)} {inv?.unit || ''}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-lg shadow-xl p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create BOM Recipe</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Finished Product</label>
              <select value={bomProductId} onChange={(e) => setBomProductId(Number(e.target.value))} className={inputClass}>
                <option value={0}>Select finished product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.code} - {product.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">BOM Version</label>
              <input value={bomVersion} onChange={(e) => setBomVersion(e.target.value)} className={inputClass} placeholder="e.g. v1" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">BOM Batch Size</label>
              <input type="number" min="0" step="0.001" value={bomBatchSize} onChange={(e) => setBomBatchSize(e.target.value)} className={inputClass} placeholder="e.g. 100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">BOM Notes (Optional)</label>
              <input value={bomNotes} onChange={(e) => setBomNotes(e.target.value)} className={inputClass} placeholder="Any extra notes" />
            </div>
          </div>

          <div className="space-y-3">
            {bomLines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-6">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Material</label>
                  <select
                    value={line.material_id}
                    onChange={(e) => {
                      const materialId = Number(e.target.value);
                      const material = rawMaterials.find((m) => m.id === materialId);
                      const unit = material?.inventoryItem?.unit || material?.inventory_item?.unit || line.unit;
                      updateBomLine(idx, { material_id: materialId, unit });
                    }}
                    className={inputClass}
                  >
                    <option value={0}>Select ingredient</option>
                    {rawMaterials.map((mat) => {
                      const inv = mat.inventoryItem || mat.inventory_item;
                      return (
                        <option key={mat.id} value={mat.id}>
                          {inv?.code || '-'} - {inv?.name || '-'}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                  <input type="number" min="0" step="0.0001" value={line.quantity} onChange={(e) => updateBomLine(idx, { quantity: e.target.value })} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                  <input value={line.unit} onChange={(e) => updateBomLine(idx, { unit: e.target.value })} className={inputClass} placeholder="kg" />
                </div>
                <div className="md:col-span-1">
                  <button type="button" onClick={() => removeBomLine(idx)} className="w-full h-[42px] rounded-md border border-red-200 bg-red-50 text-red-700 text-sm hover:bg-red-100">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button type="button" onClick={addBomLine} className="px-4 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-md text-sm hover:bg-emerald-100">
              Add Material Line
            </button>
            <button type="button" disabled={saving} onClick={handleCreateBom} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-md text-sm font-medium hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50">
              Save BOM Recipe
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-lg shadow-xl p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">View BOM Details</h2>
            <label className="block text-xs font-medium text-gray-600 mb-1">BOM Recipe</label>
            <select value={selectedBomId} onChange={(e) => { setSelectedBomId(Number(e.target.value)); setCalculation(null); }} className={inputClass}>
              <option value={0}>Select BOM</option>
              {boms.map((bom) => (
                <option key={bom.id} value={bom.id}>
                  #{bom.id} | {bom.product?.code || '-'} - {bom.product?.name || '-'} | {bom.version}
                </option>
              ))}
            </select>

            <div className="mt-4 overflow-x-auto border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ingredient</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {!selectedBom || selectedBom.items.length === 0 ? (
                    <tr><td colSpan={2} className="px-3 py-4 text-center text-sm text-gray-500">No BOM selected.</td></tr>
                  ) : (
                    selectedBom.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-sm text-gray-800">{item.material?.inventoryItem?.code || '-'} - {item.material?.inventoryItem?.name || '-'}</td>
                        <td className="px-3 py-2 text-sm text-right text-gray-700">{Number(item.quantity || 0).toFixed(4)} {item.unit}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-lg shadow-xl p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Batch Production Calculator</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Target Production Quantity</label>
                <input type="number" min="0" step="0.001" value={productionQty} onChange={(e) => setProductionQty(e.target.value)} className={inputClass} />
              </div>
              <button type="button" onClick={handleCalculateRequirements} className="h-[42px] px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md text-sm font-medium hover:from-blue-700 hover:to-indigo-700">
                Calculate
              </button>
            </div>

            {calculation && (
              <div className="mt-4 space-y-3">
                <div className="text-sm text-gray-700">
                  Multiplier: <span className="font-semibold">{Number(calculation.multiplier || 0).toFixed(4)}</span> | Batch Size: <span className="font-semibold">{Number(calculation.batch_size || 0).toFixed(3)}</span>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Required</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Available</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Shortage</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {calculation.requirements.map((row) => (
                        <tr key={row.material_id}>
                          <td className="px-3 py-2 text-sm text-gray-800">{row.material_code} - {row.material_name}</td>
                          <td className="px-3 py-2 text-sm text-right text-gray-700">{Number(row.required_quantity).toFixed(4)} {row.unit}</td>
                          <td className="px-3 py-2 text-sm text-right text-gray-700">{Number(row.available_stock).toFixed(2)} {row.unit}</td>
                          <td className={`px-3 py-2 text-sm text-right font-semibold ${Number(row.shortage) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {Number(row.shortage).toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  disabled={startingProduction}
                  onClick={handleStartProduction}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-md text-sm font-medium hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
                >
                  {startingProduction ? 'Starting...' : 'Start Production (Deduct Materials)'}
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
