import React, { useState } from 'react';
import {
  useMenuItems,
  useCreateMenuItem,
  useToggleMenuItemStatus,
  useDeleteMenuItem,
} from '../../hooks/useAdmin';

export function MenuItemsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [servingGrams, setServingGrams] = useState<number | ''>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const { data: items, isLoading, error } = useMenuItems({ search: searchTerm || undefined });
  const createMutation = useCreateMenuItem();
  const toggleMutation = useToggleMenuItemStatus();
  const deleteMutation = useDeleteMenuItem();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    try {
      await createMutation.mutateAsync({
        name,
        category: category || null,
        defaultServingGrams: servingGrams ? Number(servingGrams) : null,
      });
      setName('');
      setCategory('');
      setServingGrams('');
      setIsCreating(false);
      setFeedbackMsg({ type: 'success', text: `Menu item "${name}" created successfully.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create item';
      setFeedbackMsg({ type: 'error', text: msg });
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    setFeedbackMsg(null);
    try {
      await toggleMutation.mutateAsync({ id, isAvailable: !current });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle status';
      setFeedbackMsg({ type: 'error', text: msg });
    }
  };

  const handleDelete = async (id: string, itemName: string) => {
    setFeedbackMsg(null);
    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) return;

    try {
      await deleteMutation.mutateAsync(id);
      setFeedbackMsg({ type: 'success', text: `"${itemName}" deleted.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cannot delete item';
      setFeedbackMsg({ type: 'error', text: msg });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Menu Items Catalog</h2>
          <p className="text-sm text-gray-500">Master dish list used to construct daily menus</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Add Menu Item
          </button>
        )}
      </div>

      {feedbackMsg && (
        <div
          className={`rounded-md p-4 text-sm ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {isCreating && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Create New Catalog Dish</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="dish-name" className="block text-xs font-medium text-gray-700">
                  Dish Name *
                </label>
                <input
                  id="dish-name"
                  type="text"
                  placeholder="e.g. Paneer Butter Masala"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="dish-category" className="block text-xs font-medium text-gray-700">
                  Category
                </label>
                <input
                  id="dish-category"
                  type="text"
                  placeholder="e.g. Main Course, Dessert, Dal"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="dish-serving-grams"
                  className="block text-xs font-medium text-gray-700"
                >
                  Standard Serving (grams)
                </label>
                <input
                  id="dish-serving-grams"
                  type="number"
                  min="1"
                  placeholder="150"
                  value={servingGrams}
                  onChange={(e) => setServingGrams(e.target.value ? Number(e.target.value) : '')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Create Item
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <label htmlFor="catalog-search" className="sr-only">
          Search catalog
        </label>
        <input
          id="catalog-search"
          type="text"
          placeholder="Search catalog dishes by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Items Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading catalog...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Failed to load items.</div>
        ) : items && items.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Dish Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Category</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Default Serving</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-gray-600">{item.category || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {item.defaultServingGrams ? `${item.defaultServingGrams} g` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.isAvailable ? 'Available' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => handleToggle(item.id, item.isAvailable)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-900"
                    >
                      {item.isAvailable ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="text-xs font-medium text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">No menu items found. Add one above!</div>
        )}
      </div>
    </div>
  );
}
