import PageContainer from '@/components/layout/page-container';

export default function page() {
  return (
    <PageContainer scrollable={true}>
      <div className="space-y-2">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Customize your settings 👋
          </h2>
        </div>
      </div>
    </PageContainer>
  );
}
