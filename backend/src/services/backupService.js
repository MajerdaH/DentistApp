const { sendBackupEmail } = require('./emailService');

// Schedule daily backup
const scheduleDailyBackup = async () => {
  console.log('Starting scheduled daily backup...');

  try {
    const result = await sendBackupEmail();

    if (result.success) {
      console.log('Scheduled backup completed successfully');
    } else {
      console.log('Scheduled backup skipped:', result.error);
    }
  } catch (error) {
    console.error('Scheduled backup failed:', error);
  }
};

module.exports = {
  scheduleDailyBackup
};

