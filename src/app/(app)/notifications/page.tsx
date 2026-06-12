import { Container, Text, Title } from '@mantine/core';

export default function NotificationsPage() {
  return (
    <Container size={800} px="lg" pt="lg">
      <Title order={1} fz={24}>
        Notifications
      </Title>
      <Text c="dimmed" mt="md">
        Event reminders and family updates will appear here.
      </Text>
    </Container>
  );
}
