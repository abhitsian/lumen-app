import React, { useState, useEffect } from 'react';
import { Bell, Plus, Check, Trash2, Clock, X } from 'lucide-react';
import { db } from '../../shared/db/schema';
import { Reminder } from '../../shared/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';

export function Reminders() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');

  // Fetch all reminders
  const reminders = useLiveQuery(
    () => db.reminders.orderBy('dueDate').toArray(),
    []
  );

  const handleAddReminder = async () => {
    if (!title || !dueDate || !dueTime) {
      alert('Please fill in all required fields');
      return;
    }

    const dueDateTimeString = `${dueDate}T${dueTime}`;
    const dueDateTime = new Date(dueDateTimeString);

    if (dueDateTime < new Date()) {
      alert('Please select a future date and time');
      return;
    }

    const reminder: Reminder = {
      id: uuidv4(),
      title,
      description: description || undefined,
      dueDate: dueDateTime,
      isCompleted: false,
      isNotified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.reminders.add(reminder);

    // Reset form
    setTitle('');
    setDescription('');
    setDueDate('');
    setDueTime('');
    setShowAddForm(false);
  };

  const toggleComplete = async (reminder: Reminder) => {
    await db.reminders.update(reminder.id, {
      isCompleted: !reminder.isCompleted,
      updatedAt: new Date()
    });
  };

  const deleteReminder = async (id: string) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      await db.reminders.delete(id);
    }
  };

  const getTimeUntilDue = (dueDate: Date) => {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();

    if (diff < 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const activeReminders = reminders?.filter(r => !r.isCompleted) || [];
  const completedReminders = reminders?.filter(r => r.isCompleted) || [];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-400 via-blue-400 to-blue-500 rounded-xl shadow-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Reminders</h2>
              <p className="text-sm text-gray-600">
                {activeReminders.length} active reminder{activeReminders.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 shadow-md"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Cancel' : 'Add Reminder'}
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">New Reminder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Team meeting, Submit report"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Optional notes"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddReminder}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Add Reminder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Reminders */}
        {activeReminders.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Active</h3>
            <div className="space-y-3">
              {activeReminders.map((reminder) => {
                const isOverdue = new Date(reminder.dueDate) < new Date();
                return (
                  <div
                    key={reminder.id}
                    className={`bg-white rounded-xl shadow-md p-4 border-l-4 ${
                      isOverdue ? 'border-red-500' : 'border-purple-500'
                    } hover:shadow-lg transition-shadow`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{reminder.title}</h4>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              isOverdue
                                ? 'bg-red-100 text-red-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {getTimeUntilDue(new Date(reminder.dueDate))}
                          </span>
                        </div>
                        {reminder.description && (
                          <p className="text-sm text-gray-600 mb-2">{reminder.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(reminder.dueDate).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => toggleComplete(reminder)}
                          className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                          title="Mark as complete"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Reminders */}
        {completedReminders.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Completed</h3>
            <div className="space-y-3">
              {completedReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500 opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 line-through">
                          {reminder.title}
                        </h4>
                        <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-green-100 text-green-700">
                          Completed
                        </span>
                      </div>
                      {reminder.description && (
                        <p className="text-sm text-gray-600 mb-2 line-through">
                          {reminder.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(reminder.dueDate).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleComplete(reminder)}
                        className="p-2 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors"
                        title="Mark as incomplete"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!reminders || reminders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reminders yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first reminder to stay on top of important tasks
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
            >
              Add Your First Reminder
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
