import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Typography } from 'antd';
import { 
  HomeOutlined, 
  UserOutlined, 
  RocketOutlined, 
  DollarOutlined, 
  MenuFoldOutlined, 
  MenuUnfoldOutlined,
  YoutubeOutlined
} from '@ant-design/icons';

// ✅ [경로 수정] pages 폴더에서 불러옵니다.
import InfluencerTable from './pages/InfluencerTable';
import YoutubeViral from './pages/YoutubeViral';

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState(localStorage.getItem('lastSelectedKey') || 'home');

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    localStorage.setItem('lastSelectedKey', selectedKey);
  }, [selectedKey]);

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
  };

  // ✅ 메뉴 구조 정의 (유상/무상 시딩 복구)
  const items = [
    { key: 'home', icon: <HomeOutlined />, label: '홈' },
    {
      key: 'influencer_marketing', icon: <UserOutlined />, label: '인플루언서 마케팅',
      children: [
        { key: 'paid_seeding', label: '유상 시딩' },   // ✅ 복구됨
        { key: 'unpaid_seeding', label: '무상 시딩' }  // ✅ 복구됨
      ]
    },
    {
      key: 'youtube_viral', icon: <YoutubeOutlined />, label: '유튜브 댓글 바이럴',
    },
    { 
        key: 'performance_marketing', 
        icon: <RocketOutlined />, 
        label: '퍼포먼스 마케팅' 
    },
    { 
        key: 'pl_management', 
        icon: <DollarOutlined />, 
        label: 'P/L 관리' 
    },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case 'home':
        return <div style={{ textAlign: 'center', marginTop: 50 }}><Title level={3}>홈 대시보드</Title></div>;
      
      // ✅ 유상/무상 시딩 선택 시 -> InfluencerTable 페이지(3단 탭) 보여줌
      case 'paid_seeding':
        return <InfluencerTable />;
      case 'unpaid_seeding':
        return <InfluencerTable />;
        
      case 'youtube_viral':
        return <YoutubeViral />;

      case 'performance_marketing':
        return <div style={{ textAlign: 'center', marginTop: 50 }}><Title level={3}>퍼포먼스 마케팅 페이지</Title></div>;
        
      case 'pl_management':
        return <div style={{ textAlign: 'center', marginTop: 50 }}><Title level={3}>P/L 관리 페이지</Title></div>;

      default:
        return <div>페이지를 찾을 수 없습니다.</div>;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={250}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6 }} />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]} 
          defaultOpenKeys={['influencer_marketing']}
          items={items}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', alignItems: 'center' }}>
            <div onClick={() => setCollapsed(!collapsed)} style={{ fontSize: '18px', padding: '0 24px', cursor: 'pointer' }}>
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG }}>
          {renderContent()}
        </Content>
        <Footer style={{ textAlign: 'center' }}>AtHome Admin ©{new Date().getFullYear()}</Footer>
      </Layout>
    </Layout>
  );
};

export default App;