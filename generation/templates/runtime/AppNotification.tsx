import { Notification, NotificationProps } from 'react-admin';

export const AppNotification = (props: NotificationProps) => (
  <Notification
    {...props}
    sx={{
      whiteSpace: 'pre-line',
      '& .MuiAlert-message': {
        whiteSpace: 'pre-line',
      },
      '& .MuiSnackbarContent-message': {
        whiteSpace: 'pre-line',
      },
    }}
  />
);
