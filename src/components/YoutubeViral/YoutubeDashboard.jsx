import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Table, Card, message, Space, Typography, Modal, Select, Form, Spin, Popconfirm } from 'antd';
import { YoutubeOutlined, RobotOutlined, ReloadOutlined, DeleteOutlined, EditOutlined, UploadOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const YoutubeDashboard = ({ data = [] }) => { 
  const API_BASE_URL = 'http://localhost:8000'; 

  // --- 상태 관리 ---
  const [urlInput, setUrlInput] = useState(() => sessionStorage.getItem('y_url_input') || '');
  const [commentCount, setCommentCount] = useState(5); 
  const [currentVideoId, setCurrentVideoId] = useState(() => sessionStorage.getItem('y_vid') ? parseInt(sessionStorage.getItem('y_vid')) : null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const [comments, setComments] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // ✅ 수정 모드 관리를 위한 State
  const [editingKey, setEditingKey] = useState(''); 
  const [editingContent, setEditingContent] = useState(''); // 수정 중인 내용 임시 저장

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [personas, setPersonas] = useState([]); 
  const [form] = Form.useForm();

  const pollingRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem('y_url_input', urlInput);
  }, [urlInput]);

  useEffect(() => {
    fetchPersonas();
    fetchComments(null, true); 
    return () => stopPolling();
  }, []);

  useEffect(() => {
    if (currentVideoId) {
      sessionStorage.setItem('y_vid', currentVideoId);
    }
  }, [currentVideoId]);

  // --- API 호출 함수들 ---

  const fetchPersonas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/youtube/persona`);
      setPersonas(response.data);
    } catch (error) {
      console.error('페르소나 목록 로딩 실패:', error);
    }
  };

  const fetchComments = async (videoId = null, isSilent = false) => {
    if (!isSilent) setListLoading(true);
    try {
      // ✅ 수정된 쿼리 결과(scheduled_time 포함)를 받아옴
      const response = await axios.get(`${API_BASE_URL}/youtube/videos/comments`);
      const rawData = response.data;
      
      const formattedData = rawData.map((item, index) => ({
        key: item.id || index, // key는 id 사용
        ...item,
        status: item.status || '대기 중',
        // scheduled_time은 백엔드에서 옴
      }));

      // 변경사항 감지 (단순 길이 비교)
      if (formattedData.length !== comments.length) {
           setComments(formattedData);
           if (!isSilent) message.success('목록이 업데이트되었습니다.');
           return true; 
      }
      
      setComments(formattedData); 
      return false; 
    } catch (error) {
      console.error(error);
      if (!isSilent) message.error('목록 로딩 실패');
      return false;
    } finally {
      if (!isSilent) setListLoading(false);
    }
  };

  // --- 핸들러 ---

  const handleOpenModal = () => {
    if (!urlInput) {
      message.warning('YouTube URL을 입력해주세요.');
      return;
    }
    form.resetFields();
    form.setFieldsValue({ title: '' }); 
    setIsModalVisible(true);
  };

  const handleGenerateConfirm = async () => {
    try {
      const values = await form.validateFields();
      setIsModalVisible(false); 
      setIsGenerating(true); 

      const response = await axios.post(`${API_BASE_URL}/youtube/videos_test`, {
        url: urlInput,
        title: values.title,        
        persona_id: values.persona,
        count: commentCount || 5
      });

      const videoId = response.data.video_id;
      setCurrentVideoId(videoId);
      setIsGenerating(false);
      message.success('댓글 생성이 시작되었습니다.', 3);
      startPolling(); 

    } catch (error) {
      if (error.errorFields) return;
      console.error(error);
      message.error('요청 실패');
      setIsGenerating(false);
    }
  };

  const startPolling = () => {
    stopPolling();
    let attempts = 0;
    const maxAttempts = 24; 
    
    pollingRef.current = setInterval(async () => {
      attempts++;
      const hasUpdates = await fetchComments(null, true); 
      if (hasUpdates) {
        stopPolling();
        message.success('생성 완료!', 3);
      } else if (attempts >= maxAttempts) {
        stopPolling();
      }
    }, 5000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // ✅ [수정] 댓글 삭제 핸들러
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/youtube/comments/${id}`);
      message.success('삭제되었습니다.');
      // 로컬 상태에서 바로 제거 (API 재호출 없이 반응성 향상)
      setComments(prev => prev.filter(item => item.id !== id));
      // 또는 fetchComments();
    } catch (error) {
      console.error(error);
      message.error('삭제 실패');
    }
  };

  // ✅ [수정] 댓글 등록(업로드 예약) 핸들러
  const handleRegisterComments = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('등록할 댓글을 선택해주세요.');
      return;
    }
    setUploadLoading(true);
    try {
      const selectedItems = comments.filter(item => selectedRowKeys.includes(item.key));
      const targetVideoId = selectedItems[0].video_id; 

      const payload = selectedItems.map(item => ({
          comment_id: item.id,
          content: item.content,
          scheduled_time: dayjs().format('YYYY/MM/DD HH:mm:ss') // 현재 시간 예시
      }));

      await axios.post(`${API_BASE_URL}/youtube/${targetVideoId}/upload_comment`, {
          comments: payload
      });

      message.success('댓글 등록 요청 완료');
      setSelectedRowKeys([]);
      fetchComments(null, true); 

    } catch (error) {
      console.error(error);
      message.error('등록 실패');
    } finally {
      setUploadLoading(false);
    }
  };

  // --- 테이블 수정(Edit) 관련 로직 ---

  const isEditing = (record) => record.key === editingKey;

  const edit = (record) => {
    setEditingKey(record.key);
    setEditingContent(record.content); // 현재 내용을 임시 저장
  };

  const cancel = () => {
    setEditingKey('');
    setEditingContent('');
  };

  const save = async (key) => {
    try {
      // 1. 백엔드 업데이트 요청
      await axios.put(`${API_BASE_URL}/youtube/comments/${key}`, {
        content: editingContent
      });

      // 2. 로컬 상태 업데이트
      const newData = [...comments];
      const index = newData.findIndex((item) => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, content: editingContent });
        setComments(newData);
        setEditingKey('');
        message.success('수정되었습니다.');
      }
    } catch (error) {
      console.error('Update failed:', error);
      message.error('수정 실패');
    }
  };

  // --- 테이블 컬럼 정의 ---
  const columns = [
    {
      title: '영상제목',
      dataIndex: 'video_id', 
      key: 'video_title',
      width: '15%',
      render: (videoId) => {
        const targetVideo = data.find(v => v.id === videoId);
        return <Text strong>{targetVideo ? targetVideo.title : '-'}</Text>;
      }
    },
    {
      title: 'URL',
      dataIndex: 'video_id',
      key: 'video_url',
      width: '10%',
      render: (videoId) => {
        const targetVideo = data.find(v => v.id === videoId);
        if (!targetVideo) return '-';
        return (
          <a href={targetVideo.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px' }}>
            링크
          </a>
        );
      }
    },
    {
      title: '썸네일',
      dataIndex: 'thumbnail_url',
      key: 'thumbnail_url',
      width: '10%',
      align: 'center',
      render: (url) => (
        url ? (
          <img 
            src={url} 
            alt="thumbnail" 
            style={{ 
              width: '80px', 
              height: '45px', 
              objectFit: 'cover', 
              borderRadius: '4px',
              border: '1px solid #f0f0f0'
            }} 
          />
        ) : <span style={{fontSize: '10px', color:'#ccc'}}>No Image</span>
      )
    },
    {
      title: '생성된 댓글',
      dataIndex: 'content',
      key: 'content',
      width: '35%',
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <TextArea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            autoSize={{ minRows: 2, maxRows: 6 }}
            style={{ color: '#d63384' }}
          />
        ) : (
          <div style={{ whiteSpace: 'pre-wrap', color: '#d63384' }}>{text}</div>
        );
      },
    },
    {
        title: '상태',
        dataIndex: 'status',
        key: 'status',
        width: '10%',
        align: 'center',
        render: (status) => (
            <span style={{ color: status === '등록 완료' ? '#d63384' : '#888', fontSize: '12px' }}>
                {status}
            </span>
        )
    },
    // ✅ [추가] 업로드 시점 컬럼
    {
        title: '업로드 시점',
        dataIndex: 'scheduled_time',
        key: 'scheduled_time',
        width: '15%',
        align: 'center',
        render: (time) => (
            <span style={{ color: time ? '#1890ff' : '#ccc', fontSize: '12px' }}>
                {time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'}
            </span>
        )
    },
    // ✅ [수정] 작업 컬럼 (수정/저장/취소/삭제)
    {
      title: '작업',
      key: 'action',
      align: 'center',
      width: '15%',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space size="small">
            <Button 
                type="primary" 
                size="small" 
                icon={<SaveOutlined />} 
                onClick={() => save(record.key)}
            >
                저장
            </Button>
            <Button 
                size="small" 
                icon={<CloseOutlined />} 
                onClick={cancel}
            >
                취소
            </Button>
          </Space>
        ) : (
          <Space size="small">
            <Button 
                size="small" 
                icon={<EditOutlined />} 
                onClick={() => edit(record)} 
            >
              수정
            </Button>
            <Popconfirm title="정말 삭제하시겠습니까?" onConfirm={() => handleDelete(record.id)}>
                <Button size="small" danger icon={<DeleteOutlined />}>
                  삭제
                </Button>
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ marginTop: 20 }}>
      <Spin spinning={isGenerating} tip="요청 전송 중..." size="large">
        
        <Card bordered={false} style={{ marginBottom: 24 }}>
          <Title level={4} style={{ marginBottom: 16 }}>
            <YoutubeOutlined style={{ color: 'red', marginRight: 8 }} />
            영상 등록 및 댓글 생성
          </Title>
          <Space.Compact style={{ width: '100%' }} size="large">
            <Input 
              placeholder="YouTube 영상 URL을 입력하세요" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onPressEnter={handleOpenModal}
            />
            <Button 
              type="primary" 
              icon={<RobotOutlined />} 
              onClick={handleOpenModal}
              style={{ backgroundColor: '#ff0000', borderColor: '#ff0000' }}
            >
              등록 & 생성
            </Button>
          </Space.Compact>
        </Card>

        <Card bordered={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0 }}>
               전체 생성 댓글 리스트
            </Title>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => fetchComments(null, false)} 
              loading={listLoading}
            >
              새로고침
            </Button>
          </div>

          <Table 
            rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys)
            }}
            columns={columns} 
            dataSource={comments} 
            pagination={{ pageSize: 10 }} 
            loading={listLoading}
            locale={{ emptyText: '생성된 댓글이 없습니다.' }}
          />
          
          <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button 
                type="primary" 
                size="large"
                icon={<UploadOutlined />}
                onClick={handleRegisterComments}
                loading={uploadLoading}
                style={{ backgroundColor: '#1f1f1f', borderColor: '#1f1f1f', minWidth: '150px' }}
              >
                  선택 댓글 등록
              </Button>
          </div>

        </Card>
      </Spin>

      <Modal
        title="영상 정보 및 페르소나 설정"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleGenerateConfirm}
        okText="댓글 생성 시작"
        cancelText="취소"
        confirmLoading={isGenerating}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="영상 제목"
            name="title"
            rules={[{ required: true, message: '제목 입력' }]}
          >
            <Input prefix={<EditOutlined />} />
          </Form.Item>

          <Form.Item
            label="AI 페르소나"
            name="persona"
            rules={[{ required: true, message: '페르소나 선택' }]}
          >
            <Select>
              {personas.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default YoutubeDashboard;