import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Modal, Form, Input, message, Space, Typography, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RobotOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const YoutubePrompt = () => {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 모달 상태
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [form] = Form.useForm();

  // ✅ 라우터 주소에 맞춰 API 호출 경로 수정됨
  const API_BASE_URL = 'http://34.64.158.35:8000';

  // 1. 목록 조회 (GET /youtube/persona)
  const fetchPersonas = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/youtube/persona`);
      // antd key 설정
      const formattedData = response.data.map(item => ({ key: item.id, ...item }));
      setPersonas(formattedData);
    } catch (error) {
      console.error(error);
      message.error('페르소나 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  // 2. 저장 핸들러
  const handleSave = async (values) => {
    try {
      if (editingId) {
        // ✅ 수정 (PUT /youtube/persona/{id})
        await axios.put(`${API_BASE_URL}/youtube/persona/${editingId}`, values);
        message.success('페르소나가 수정되었습니다.');
      } else {
        // ✅ 생성 (POST /youtube/persona)
        await axios.post(`${API_BASE_URL}/youtube/persona`, values);
        message.success('새로운 페르소나가 생성되었습니다.');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchPersonas(); 
    } catch (error) {
      console.error(error);
      message.error('저장에 실패했습니다.');
    }
  };

  // 3. 삭제 핸들러
  const handleDelete = async (id) => {
    try {
      // ✅ 삭제 (DELETE /youtube/persona/{id}) 
      // 백엔드 @router.delete("/persona/{persona_id}") 로 맞춰주세요!
      await axios.delete(`${API_BASE_URL}/youtube/persona/${id}`);
      message.success('삭제되었습니다.');
      fetchPersonas();
    } catch (error) {
      console.error(error);
      message.error('삭제 실패');
    }
  };

  // 모달 열기 (생성)
  const showCreateModal = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 모달 열기 (수정)
  const showEditModal = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      system_prompt: record.system_prompt,
      user_prompt: record.user_prompt
    });
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      align: 'center',
    },
    {
      title: '페르소나 이름',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '시스템 프롬프트 (Role)',
      dataIndex: 'system_prompt',
      key: 'system_prompt',
      width: 350,
      render: (text) => (
        <Paragraph 
            ellipsis={{ rows: 2, expandable: true, symbol: '더 보기' }} 
            style={{ marginBottom: 0, color: '#555' }}
        >
            {text}
        </Paragraph>
      )
    },
    {
      title: '유저 프롬프트 (Instruction)',
      dataIndex: 'user_prompt',
      key: 'user_prompt',
      render: (text) => (
        <Paragraph 
            ellipsis={{ rows: 2, expandable: true, symbol: '더 보기' }} 
            style={{ marginBottom: 0, color: '#555' }}
        >
            {text}
        </Paragraph>
      )
    },
    {
      title: '관리',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => showEditModal(record)} 
          />
          <Popconfirm 
            title="정말 삭제하시겠습니까?" 
            onConfirm={() => handleDelete(record.id)}
            okText="삭제" cancelText="취소"
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
            <RobotOutlined style={{ marginRight: 8 }} />
            AI 페르소나 관리
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
          새 페르소나 추가
        </Button>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table 
          columns={columns} 
          dataSource={personas} 
          rowKey="id"
          pagination={{ pageSize: 5 }} 
          loading={loading}
          locale={{ emptyText: "등록된 페르소나가 없습니다." }}
        />
      </Card>

      <Modal
        title={editingId ? "페르소나 수정" : "새 페르소나 추가"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={form.submit}
        okText="저장"
        cancelText="취소"
        width={700} 
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            label="페르소나 이름"
            name="name"
            rules={[{ required: true, message: '이름을 입력해주세요.' }]}
          >
            <Input placeholder="예: 20대 대학생, 냉철한 평론가..." />
          </Form.Item>

          <Form.Item
            label="시스템 프롬프트 (System Prompt)"
            name="system_prompt"
            rules={[{ required: true, message: 'AI 역할을 정의해주세요.' }]}
            tooltip="AI에게 부여할 역할, 말투, 성격을 정의합니다."
          >
            <TextArea 
                rows={6} 
                placeholder="예: 너는 유튜브 영상의 분위기를 분석하는 AI야. 말투는 ~해요체를 사용하고..." 
                showCount
            />
          </Form.Item>

          <Form.Item
            label="유저 프롬프트 (User Prompt)"
            name="user_prompt"
            rules={[{ required: true, message: '구체적인 지시사항을 입력해주세요.' }]}
            tooltip="AI에게 실제로 시킬 작업 내용을 적습니다."
          >
            <TextArea 
                rows={4} 
                placeholder="예: 다음 영상 정보를 바탕으로 베스트 댓글 5개를 작성해줘." 
                showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default YoutubePrompt;