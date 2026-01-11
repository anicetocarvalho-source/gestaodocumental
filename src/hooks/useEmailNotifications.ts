import { supabase } from '@/integrations/supabase/client';

export type EmailNotificationType = 
  | 'pending_approval' 
  | 'sla_alert' 
  | 'movement' 
  | 'dispatch_update' 
  | 'process_update';

interface SendEmailParams {
  type: EmailNotificationType;
  recipientUserId?: string;
  recipientEmail?: string;
  data: Record<string, any>;
}

export async function sendNotificationEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: params
    });

    if (error) {
      console.error('Error sending notification email:', error);
      return { success: false, error: error.message };
    }

    if (data?.skipped) {
      console.log('Email skipped:', data.reason);
      return { success: true };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error invoking send-notification-email:', error);
    return { success: false, error: error.message };
  }
}

// Helper functions for specific notification types
export async function sendPendingApprovalEmail(
  recipientUserId: string,
  itemType: 'dispatch' | 'process',
  itemNumber: string,
  subject: string,
  requesterName: string,
  priority: string,
  deadline?: string,
  referenceId?: string
) {
  return sendNotificationEmail({
    type: 'pending_approval',
    recipientUserId,
    data: {
      itemType,
      itemNumber,
      subject,
      requesterName,
      priority,
      deadline,
      referenceType: itemType,
      referenceId
    }
  });
}

export async function sendSLAAlertEmail(
  recipientUserId: string,
  itemType: string,
  itemNumber: string,
  subject: string,
  hoursRemaining: number,
  deadline: string,
  referenceId?: string
) {
  return sendNotificationEmail({
    type: 'sla_alert',
    recipientUserId,
    data: {
      itemType,
      itemNumber,
      subject,
      hoursRemaining,
      deadline,
      referenceType: itemType.toLowerCase(),
      referenceId
    }
  });
}

export async function sendMovementEmail(
  recipientUserId: string,
  actionType: string,
  documentNumber: string,
  documentTitle: string,
  fromUnit: string,
  toUnit: string,
  observations?: string,
  referenceId?: string
) {
  return sendNotificationEmail({
    type: 'movement',
    recipientUserId,
    data: {
      actionType,
      documentNumber,
      documentTitle,
      fromUnit,
      toUnit,
      observations,
      referenceType: 'document',
      referenceId
    }
  });
}

export async function sendDispatchUpdateEmail(
  recipientUserId: string,
  dispatchNumber: string,
  subject: string,
  status: string,
  approverName?: string,
  comments?: string,
  referenceId?: string
) {
  return sendNotificationEmail({
    type: 'dispatch_update',
    recipientUserId,
    data: {
      dispatchNumber,
      subject,
      status,
      approverName,
      comments,
      referenceType: 'dispatch',
      referenceId
    }
  });
}

export async function sendProcessUpdateEmail(
  recipientUserId: string,
  processNumber: string,
  subject: string,
  status: string,
  updateDescription?: string,
  referenceId?: string
) {
  return sendNotificationEmail({
    type: 'process_update',
    recipientUserId,
    data: {
      processNumber,
      subject,
      status,
      updateDescription,
      referenceType: 'process',
      referenceId
    }
  });
}

// Trigger SLA check (can be called periodically or via cron)
export async function triggerSLACheck(): Promise<{ success: boolean; alertsSent?: number; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('check-sla-alerts');

    if (error) {
      console.error('Error triggering SLA check:', error);
      return { success: false, error: error.message };
    }

    return { success: true, alertsSent: data?.alertsSent };
  } catch (error: any) {
    console.error('Error invoking check-sla-alerts:', error);
    return { success: false, error: error.message };
  }
}

// Trigger retention alerts check
export async function triggerRetentionAlertsCheck(): Promise<{ success: boolean; alertsSent?: number; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('retention-alerts');

    if (error) {
      console.error('Error triggering retention alerts:', error);
      return { success: false, error: error.message };
    }

    return { success: true, alertsSent: data?.alertsSent };
  } catch (error: any) {
    console.error('Error invoking retention-alerts:', error);
    return { success: false, error: error.message };
  }
}
