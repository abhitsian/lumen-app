import { db } from '../db/schema';

class ReminderNotificationService {
  private checkInterval: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;

  start() {
    // Check every 30 seconds for due reminders
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, 30000); // 30 seconds

    // Also check immediately
    this.checkReminders();
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkReminders() {
    try {
      const now = new Date();

      // Find reminders that are due and not yet notified
      const dueReminders = await db.reminders
        .where('isCompleted')
        .equals(0)
        .and(reminder => {
          const dueDate = new Date(reminder.dueDate);
          return !reminder.isNotified && dueDate <= now;
        })
        .toArray();

      for (const reminder of dueReminders) {
        await this.notifyReminder(reminder);
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  private async notifyReminder(reminder: any) {
    try {
      // Play sound
      this.playNotificationSound();

      // Show system notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Reminder: ' + reminder.title, {
          body: reminder.description || 'Your reminder is due',
          icon: '/icon.png',
          tag: reminder.id,
          requireInteraction: true
        });
      }

      // Mark as notified
      await db.reminders.update(reminder.id, {
        isNotified: true,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error notifying reminder:', error);
    }
  }

  private playNotificationSound() {
    try {
      // Create audio context if it doesn't exist
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      // Create a simple ping sound (sine wave)
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Frequency for a pleasant ping (E note)
      oscillator.frequency.value = 659.25;
      oscillator.type = 'sine';

      // Envelope: quick attack and decay for ping effect
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3); // Decay

      oscillator.start(now);
      oscillator.stop(now + 0.3);
    } catch (error) {
      console.error('Error playing notification sound:', error);
      // Fallback to system beep
      console.beep?.();
    }
  }

  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  }
}

export const reminderNotificationService = new ReminderNotificationService();
