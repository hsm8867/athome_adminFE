import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, message, Card, Modal, Input, Form, Popconfirm } from 'antd'; // ✅ Popconfirm 추가
import { PlusOutlined, ReloadOutlined, GoogleOutlined, DeleteOutlined } from '@ant-design/icons'; // ✅ DeleteOutlined 추가
import axios from 'axios';

const YoutubeAccount = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 모달 관련 상태
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm(); 

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // ✅ [추가됨] 계정 삭제 핸들러
  const handleDelete = async (id) => {
    try {
        await axios.delete(`${API_BASE_URL}/youtube/accounts/${id}`);
        message.success('계정이 삭제되었습니다.');
        // 목록 갱신 (로컬 상태에서 제거하여 불필요한 API 호출 방지)
        setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
        console.error('삭제 실패:', error);
        message.error('계정 삭제에 실패했습니다.');
    }
  };

  // 2. "계정 등록" 버튼 클릭 시 모달 열기
  const showRegisterModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  // 3. 모달 인증 처리
  const handleRegisterStart = (values) => {
    const email = values.email;
    setIsModalVisible(false); 

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

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        message.info('인증이 종료되었습니다. 목록을 갱신합니다.');
        fetchAccounts(); 
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
        return (
            <Space>
                {/* 재시도 버튼 (실패/대기 상태일 때만) */}
                {record.onboarding_status !== 1 && (
                    <Button 
                        size="small"
                        icon={<ReloadOutlined />} 
                        onClick={() => {
                            form.setFieldsValue({ email: record.email });
                            handleRegisterStart({ email: record.email });
                        }}
                    >
                        재시도
                    </Button>
                )}

                {/* ✅ [추가됨] 삭제 버튼 */}
                <Popconfirm 
                    title="계정 삭제"
                    description="정말 이 계정을 삭제하시겠습니까?"
                    onConfirm={() => handleDelete(record.id)}
                    okText="삭제"
                    cancelText="취소"
                    okButtonProps={{ danger: true }}
                >
                    <Button 
                        size="small" 
                        danger 
                        icon={<DeleteOutlined />}
                    >
                        삭제
                    </Button>
                </Popconfirm>
            </Space>
        );
      },
    },
  ];

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>유튜브 계정 관리</h3>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAccounts}>
            새로고침
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={showRegisterModal}>
            계정 등록
          </Button>
        </Space>
      </div>
      
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table 
          columns={columns} 
          dataSource={data} 
          pagination={{ pageSize: 5 }} 
          loading={loading}
          locale={{ emptyText: '등록된 계정이 없습니다.' }}
        />
      </Card>

      <Modal
        title="유튜브 계정 등록"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null} 
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
                        인증
                    </Button>
                </Space>
            </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default YoutubeAccount;