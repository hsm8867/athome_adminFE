import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, message, Card, Modal, Input, Form } from 'antd';
import { PlusOutlined, ReloadOutlined, GoogleOutlined } from '@ant-design/icons';
import axios from 'axios';

const YoutubeAccount = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 모달 관련 상태
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm(); // 이메일 입력 폼

  const API_BASE_URL = 'http://34.64.158.35:8000'; 

  // 1. 계정 목록 불러오기
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/youtube/accounts`);
      const formattedData = response.data.map((item) => ({
        key: item.id,
        ...item,
      }));
      setData(formattedData);
    } catch (error) {
      console.error('계정 로딩 실패:', error);
      // message.error('계정 목록을 불러오지 못했습니다.'); // 너무 자주 뜨면 주석 처리
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // 2. "계정 등록" 버튼 클릭 시 모달 열기
  const showRegisterModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  // 3. 모달에서 이메일 입력 후 "확인" 눌렀을 때 -> 구글 로그인 진행
  const handleRegisterStart = (values) => {
    const email = values.email;
    setIsModalVisible(false); // 모달 닫기

    // 팝업 설정
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const loginUrl = `${API_BASE_URL}/oauth/google/login?email=${encodeURIComponent(email)}`;

    message.loading('구글 인증 팝업을 엽니다...', 1);

    const popup = window.open(
      loginUrl,
      'GoogleLoginPopup',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
    );

    // 팝업 감지
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        message.info('인증이 종료되었습니다. 목록을 갱신합니다.');
        fetchAccounts(); // 목록 갱신 (성공했으면 리스트에 뜸)
      }
    }, 1000);
  };

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '35%',
    },
    {
      title: '상태',
      dataIndex: 'onboarding_status',
      key: 'onboarding_status',
      align: 'center',
      render: (status) => {
        // 백엔드에서: 1=성공, -1=실패, 0=대기
        if (status === 1) {
            return <Tag color="green">연동 완료 (Active)</Tag>;
        } else if (status === -1) {
            return <Tag color="red">등록 실패 (Error)</Tag>;
        } else {
            return <Tag color="default">대기 중</Tag>;
        }
      },
    },
    {
      title: '최근 갱신일',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (text) => text ? new Date(text).toLocaleDateString() : '-',
    },
    {
      title: '작업',
      key: 'action',
      align: 'center',
      render: (_, record) => {
        // 등록 실패(-1)했거나 대기중이면 다시 시도할 수 있게 버튼 표시
        if (record.onboarding_status !== 1) {
            return (
                 <Button 
                    size="small"
                    icon={<ReloadOutlined />} 
                    onClick={() => {
                        form.setFieldsValue({ email: record.email }); // 이메일 채워주기
                        handleRegisterStart({ email: record.email }); // 바로 로그인 프로세스 시작
                    }}
                 >
                    재시도
                 </Button>
            );
        }
        return <span style={{ color: '#aaa', fontSize: '12px' }}>정상 작동 중</span>;
      },
    },
  ];

  return (
    <div style={{ marginTop: 20 }}>
      {/* 상단 헤더 영역 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>유튜브 계정 관리</h3>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAccounts}>
            새로고침
          </Button>
          {/* ✅ 계정 등록 버튼 (피그마 스타일) */}
          <Button type="primary" icon={<PlusOutlined />} onClick={showRegisterModal}>
            계정 등록
          </Button>
        </Space>
      </div>
      
      {/* 데이터 테이블 */}
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table 
          columns={columns} 
          dataSource={data} 
          pagination={{ pageSize: 5 }} 
          loading={loading}
          locale={{ emptyText: '등록된 계정이 없습니다. [계정 등록]을 눌러 추가하세요.' }}
        />
      </Card>

      {/* ✅ 이메일 입력 모달 */}
      <Modal
        title="유튜브 계정 등록"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null} // Form 내부 버튼 사용
      >
        <p>연동할 유튜브 채널의 <b>Google 계정 이메일</b>을 입력해주세요.</p>
        <Form form={form} onFinish={handleRegisterStart} layout="vertical">
            <Form.Item
                name="email"
                label="이메일 주소"
                rules={[
                    { required: true, message: '이메일을 입력해주세요' },
                    { type: 'email', message: '올바른 이메일 형식이 아닙니다' }
                ]}
            >
                <Input placeholder="example@gmail.com" prefix={<GoogleOutlined />} />
            </Form.Item>
            
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                    <Button onClick={() => setIsModalVisible(false)}>취소</Button>
                    <Button type="primary" htmlType="submit">
                        인증 팝업 열기
                    </Button>
                </Space>
            </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default YoutubeAccount;