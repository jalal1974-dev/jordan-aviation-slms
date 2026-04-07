import React from 'react';
import { Card, Result } from 'antd';

interface PlaceholderPageProps {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, icon, subtitle }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 160px)',
        padding: 24,
      }}
    >
      <Card
        style={{
          maxWidth: 600,
          width: '100%',
          borderRadius: 16,
          borderTop: '4px solid #D4AF37',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <Result
          icon={
            <span style={{ fontSize: 64, color: '#D4AF37', display: 'block', textAlign: 'center' }}>
              {icon}
            </span>
          }
          title={<span style={{ fontSize: 22, fontWeight: 700, color: '#001529' }}>{title}</span>}
          subTitle={
            subtitle || (
              <span style={{ color: '#8c8c8c', fontSize: 15 }}>
                Coming Soon — Under Construction
              </span>
            )
          }
        />
      </Card>
    </div>
  );
};

export default PlaceholderPage;
