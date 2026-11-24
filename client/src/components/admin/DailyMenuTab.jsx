import React, { useState } from 'react';
import {
  useMenus,
  useMenuItems,
  useCreateMenu,
  useDeleteMenu,
  useAddDish,
  useRemoveDish,
  useGenerateTimeSlots,
} from '../../hooks/useAdmin.js';
import { MealType } from '@shared/types';

const extractErrorMessage = (err, fallback) => {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error?.message ||
    (err instanceof Error ? err.message : fallback)
  );
};

export function DailyMenuTab() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedMealType, setSelectedMealType] = useState('');

  const [isCreatingMenu, setIsCreatingMenu] = useState(false);
  const [newMenuDate, setNewMenuDate] = useState(todayStr);
  const [newMenuMealType, setNewMenuMealType] = useState(MealType.BREAKFAST);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  const [addingDishMenuId, setAddingDishMenuId] = useState(null);
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState('');
  const [dishServingGrams, setDishServingGrams] = useState('');

  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const { data: menus, isLoading: loadingMenus } = useMenus({
    date: selectedDate || undefined,
    mealType: selectedMealType || undefined,
  });

  const { data: catalogItems } = useMenuItems({ isAvailable: true });
  const createMenuMutation = useCreateMenu();
  const deleteMenuMutation = useDeleteMenu();
  const addDishMutation = useAddDish();
  const removeDishMutation = useRemoveDish();
  const generateSlotsMutation = useGenerateTimeSlots();

  const handleCreateMenu = async (e) => {
    e.preventDefault();
    setFeedbackMsg(null);
    try {
      const dishes = selectedItemIds
        .map((id) => {
          const item = catalogItems?.find((c) => c.id === id);
          return item
            ? {
                menuItemId: item.id,
                dishName: item.name,
                dishCategory: item.category,
                servingGrams: item.defaultServingGrams,
              }
            : null;
        })
        .filter((d) => d !== null);

      await createMenuMutation.mutateAsync({
        date: newMenuDate,
        mealType: newMenuMealType,
        dishes,
      });

      setIsCreatingMenu(false);
      setSelectedItemIds([]);
      setFeedbackMsg({
        type: 'success',
        text: `Menu created for ${newMenuMealType} on ${newMenuDate} with auto-generated slots.`,
      });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to create menu');
      setFeedbackMsg({ type: 'error', text: msg });
    }
  };

  const handleDeleteMenu = async (menuId, info) => {
    setFeedbackMsg(null);
    if (!window.confirm(`Delete menu for ${info}? This will remove associated dishes and slots.`))
      return;

    try {
      await deleteMenuMutation.mutateAsync(menuId);
      setFeedbackMsg({ type: 'success', text: 'Menu deleted successfully.' });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Cannot delete menu');
      setFeedbackMsg({ type: 'error', text: msg });
    }
  };

  const handleAddDish = async (e, menuId) => {
    e.preventDefault();
    setFeedbackMsg(null);
    try {
      await addDishMutation.mutateAsync({
        menuId,
        payload: {
          dishName,
          dishCategory: dishCategory || null,
          servingGrams: dishServingGrams ? Number(dishServingGrams) : null,
        },
      });
      setAddingDishMenuId(null);
      setDishName('');
      setDishCategory('');
      setDishServingGrams('');
      setFeedbackMsg({ type: 'success', text: `Dish "${dishName}" added to menu.` });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to add dish');
      setFeedbackMsg({ type: 'error', text: msg });
    }
  };

  const handleRemoveDish = async (menuId, dishId, name) => {
    setFeedbackMsg(null);
    if (!window.confirm(`Remove "${name}" from this menu?`)) return;

    try {
      await removeDishMutation.mutateAsync({ menuId, dishId });
      setFeedbackMsg({ type: 'success', text: `Removed "${name}" from menu.` });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Cannot remove dish');
      setFeedbackMsg({ type: 'error', text: msg });
    }
  };

  const handleGenerateSlots = async (menuId) => {
    setFeedbackMsg(null);
    try {
      await generateSlotsMutation.mutateAsync(menuId);
      setFeedbackMsg({ type: 'success', text: 'Time slots generated successfully.' });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to generate time slots');
      setFeedbackMsg({ type: 'error', text: msg });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Daily Menus & Time Slots</h2>
          <p className="text-sm text-gray-500">Plan menus and manage bookable dining slots</p>
        </div>
        {!isCreatingMenu && (
          <button
            onClick={() => setIsCreatingMenu(true)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Create Daily Menu
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

      {/* Create Menu Form */}
      {isCreatingMenu && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Create Daily Menu</h3>
          <form onSubmit={handleCreateMenu} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="menu-date-input"
                  className="block text-xs font-medium text-gray-700"
                >
                  Service Date
                </label>
                <input
                  id="menu-date-input"
                  type="date"
                  value={newMenuDate}
                  onChange={(e) => setNewMenuDate(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="menu-meal-select"
                  className="block text-xs font-medium text-gray-700"
                >
                  Meal Service
                </label>
                <select
                  id="menu-meal-select"
                  value={newMenuMealType}
                  onChange={(e) => setNewMenuMealType(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value={MealType.BREAKFAST}>Breakfast</option>
                  <option value={MealType.LUNCH}>Lunch</option>
                  <option value={MealType.DINNER}>Dinner</option>
                </select>
              </div>
            </div>

            {/* Select dishes from catalog */}
            <div>
              <span className="block text-xs font-medium text-gray-700 mb-2">
                Select Dishes from Catalog:
              </span>
              {catalogItems && catalogItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white p-3 sm:grid-cols-3">
                  {catalogItems.map((item) => {
                    const checked = selectedItemIds.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemIds([...selectedItemIds, item.id]);
                            } else {
                              setSelectedItemIds(selectedItemIds.filter((id) => id !== item.id));
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>
                          {item.name} {item.category && `(${item.category})`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  No catalog items available. You can add dishes manually later.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMenuMutation.isPending}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Create & Generate Slots
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingMenu(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter by Date & Meal */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div>
          <label htmlFor="filter-date-input" className="block text-xs font-medium text-gray-600">
            Filter Date
          </label>
          <input
            id="filter-date-input"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="filter-meal-select" className="block text-xs font-medium text-gray-600">
            Meal Service
          </label>
          <select
            id="filter-meal-select"
            value={selectedMealType}
            onChange={(e) => setSelectedMealType(e.target.value)}
            className="mt-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Meals</option>
            <option value={MealType.BREAKFAST}>Breakfast</option>
            <option value={MealType.LUNCH}>Lunch</option>
            <option value={MealType.DINNER}>Dinner</option>
          </select>
        </div>
      </div>

      {/* Menus List */}
      {loadingMenus ? (
        <div className="p-8 text-center text-gray-500">Loading menus...</div>
      ) : menus && menus.length > 0 ? (
        <div className="space-y-6">
          {menus.map((menu) => {
            const isAddingDish = addingDishMenuId === menu.id;

            return (
              <div
                key={menu.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 uppercase">
                        {menu.mealType}
                      </span>
                      <h3 className="text-base font-semibold text-gray-900">
                        {new Date(menu.date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleGenerateSlots(menu.id)}
                      disabled={generateSlotsMutation.isPending}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Regenerate Slots
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteMenu(
                          menu.id,
                          `${menu.mealType} on ${new Date(menu.date).toLocaleDateString()}`,
                        )
                      }
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Delete Menu
                    </button>
                  </div>
                </div>

                {/* Dishes Section */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Dishes
                    </h4>
                    {!isAddingDish && (
                      <button
                        onClick={() => setAddingDishMenuId(menu.id)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        + Add Dish
                      </button>
                    )}
                  </div>

                  {isAddingDish && (
                    <form
                      onSubmit={(e) => handleAddDish(e, menu.id)}
                      className="mb-4 rounded-md bg-gray-50 p-3 space-y-3"
                    >
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <input
                          type="text"
                          placeholder="Dish name *"
                          value={dishName}
                          onChange={(e) => setDishName(e.target.value)}
                          required
                          className="rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Category (optional)"
                          value={dishCategory}
                          onChange={(e) => setDishCategory(e.target.value)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                        <input
                          type="number"
                          placeholder="Serving grams (optional)"
                          value={dishServingGrams}
                          onChange={(e) =>
                            setDishServingGrams(e.target.value ? Number(e.target.value) : '')
                          }
                          className="rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={addDishMutation.isPending}
                          className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                        >
                          Save Dish
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingDishMenuId(null)}
                          className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {menu.dishes && menu.dishes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {menu.dishes.map((dish) => (
                        <div
                          key={dish.id}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700"
                        >
                          <span className="font-medium text-gray-900">{dish.dishName}</span>
                          {dish.servingGrams && (
                            <span className="text-gray-400">({dish.servingGrams}g)</span>
                          )}
                          <button
                            onClick={() => handleRemoveDish(menu.id, dish.id, dish.dishName)}
                            className="text-gray-400 hover:text-red-600"
                            title="Remove dish"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No dishes added yet.</p>
                  )}
                </div>

                {/* Time Slots Section */}
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Bookable Time Slots
                  </h4>
                  {menu.slots && menu.slots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
                      {menu.slots.map((slot) => {
                        const start = new Date(slot.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        });
                        const end = new Date(slot.endTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        });

                        return (
                          <div
                            key={slot.id}
                            className="rounded-md border border-gray-200 bg-gray-50 p-2 text-center text-xs"
                          >
                            <span className="font-semibold text-gray-800">
                              {start} – {end}
                            </span>
                            <div className="mt-1 text-[11px] text-gray-500">
                              Cap:{' '}
                              <span className="font-medium text-gray-700">{slot.capacity}</span> |
                              Booked:{' '}
                              <span className="font-medium text-indigo-600">
                                {slot.currentBookings}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      No slots generated. Click "Regenerate Slots" above.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
          No menus scheduled for this date. Click "+ Create Daily Menu" to set up a meal service.
        </div>
      )}
    </div>
  );
}

