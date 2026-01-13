import React, { useState } from 'react';
import { Layout, Menu, theme, Typography } from 'antd';
import { 
  HomeOutlined, 
  UserOutlined, 
  RocketOutlined, 
  DollarOutlined, 
  MenuFoldOutlined, 
  MenuUnfoldOutlined 
} from '@ant-design/icons';
import InfluencerTable from './InfluencerTable';

// ✅ 로고 이미지가 있다면 경로 유지, 없다면 주석 처리
// import logoImg from './assets/logo.png'; 

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  
  // ✅ 현재 선택된 메뉴 키 관리 (기본값: 홈)
  const [selectedKey, setSelectedKey] = useState('home');

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // ✅ 메뉴 구조 정의 (대분류 -> 중분류 -> 소분류)
  const items = [
    // 1. 홈
    { 
      key: 'home', 
      icon: <HomeOutlined />, 
      label: '홈' 
    },
    
    // 2. 인플루언서 마케팅 (토글)
    {
      key: 'influencer_marketing',
      icon: <UserOutlined />,
      label: '인플루언서 마케팅',
      children: [
        // 2-1. 유상 시딩 (토글)
        {
          key: 'paid_seeding',
          label: '유상 시딩',
          children: [
            // 2-1-1. 인플루언서 선별 (클릭 시 테이블 표출)
            { key: 'paid_selection', label: '인플루언서 선별' },
          ]
        },
        // 2-2. 무상 시딩 (토글)
        {
          key: 'unpaid_seeding',
          label: '무상 시딩',
          children: [
            // 2-2-1. 인플루언서 선별 (클릭 시 테이블 표출)
            { key: 'unpaid_selection', label: '인플루언서 선별' },
          ]
        }
      ]
    },

    // 3. 퍼포먼스 마케팅
    { 
      key: 'performance_marketing', 
      icon: <RocketOutlined />, 
      label: '퍼포먼스 마케팅' 
    },

    // 4. P/L 관리
    { 
      key: 'pl_management', 
      icon: <DollarOutlined />, 
      label: 'P/L 관리' 
    },
  ];

  // ✅ 메뉴 클릭 핸들러
  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
  };

  // ✅ 메인 콘텐츠 렌더링 함수
  const renderContent = () => {
    switch (selectedKey) {
      // '유상-선별' 또는 '무상-선별' 클릭 시 우리가 만든 테이블 보여주기
      case 'paid_selection':
      case 'unpaid_selection':
        return <InfluencerTable />;
        
      case 'home':
        return <div style={{ textAlign: 'center', marginTop: 50 }}><Title level={3}>홈 대시보드 (준비 중)</Title></div>;
      
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
        
        {/* 로고 영역 (플레이스홀더) */}
        <div style={{ 
          height: 32, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.2)', 
          borderRadius: 6 
        }} />

        {/* ✅ 메뉴 영역 */}
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['home']}
          defaultOpenKeys={['influencer_marketing', 'paid_seeding']} // 처음부터 펼쳐놓을 메뉴 키
          items={items}
          onClick={handleMenuClick} // 클릭 시 selectedKey 변경
        />
      </Sider>

      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', alignItems: 'center' }}>
            <div 
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '18px', padding: '0 24px', cursor: 'pointer' }}
            >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
        </Header>
        
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG }}>
          {/* ✅ 선택된 메뉴에 따라 화면이 바뀝니다 */}
          {renderContent()}
        </Content>
        
        <Footer style={{ textAlign: 'center' }}>
          AtHome Admin ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
};

export default App;