import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Heart, ChevronDown, ChevronUp, User } from 'lucide-react';
import { addDonor, subscribeToDonors } from './firebase';
import { Spinner } from './components/ui/spinner';

const GIFT_NAME = 'Beats Studio Pro Wireless 헤드폰';
const GIFT_TOTAL = 284000;
const ACCOUNT_BANK = '카카오뱅크';
const ACCOUNT_NUMBER = '3333-12-3456789';
const ACCOUNT_HOLDER = '김시아';
const GIFT_IMAGE =
  'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MQTR3?wid=2754&hei=4115&fmt=jpeg&qlt=90&.v=1741643688482';

export interface Donor {
  id: string;
  name: string;
  nickname: string;
  amount: number;
  date: string;
  oneLineMsg?: string;
}

const formatAmount = (value: string): string => {
  const digits = value.replace(/[^0-9]/g, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const parseAmount = (value: string): number => {
  return parseInt(value.replace(/,/g, '') || '0', 10);
};

const formatKoreanAmount = (amount: number): string => {
  if (amount === 0) return '0원';
  const man = Math.floor(amount / 10000);
  const cheon = Math.floor((amount % 10000) / 1000);
  const rest = amount % 1000;
  let result = '';
  if (man > 0) result += `${man}만`;
  if (cheon > 0) result += `${cheon}천`;
  if (rest > 0) result += `${rest}`;
  return result + '원';
};

const formatTimestamp = (date: any): string => {
  if (!date) return '';

  // Firestore timestamp 객체 처리
  if (date.seconds !== undefined) {
    const firebaseDate = new Date(date.seconds * 1000);
    return firebaseDate.toISOString().split('T')[0];
  }

  // 문자열 처리
  if (typeof date === 'string') {
    return date;
  }

  // Date 객체 처리
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }

  return '';
};

export default function App() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loadingDonors, setLoadingDonors] = useState(true);
  const [loadingFormSending, setLoadingFormSending] = useState(false);

  const [showFundingForm, setShowFundingForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [oneLineMsg, setOneLineMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fundedAmount, setFundedAmount] = useState(0);
  const [percentage, setPercentage] = useState(0);

  const formRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(`${ACCOUNT_BANK} ${ACCOUNT_NUMBER} ${ACCOUNT_HOLDER}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setAmountStr(formatAmount(raw));
  };

  // Function to handle donor submission
  const handleFundingSubmit = async () => {
    // Made async
    setFormError('');
    setSuccessMsg('');
    if (!name.trim()) {
      setFormError('이름을 입력해 주세요.');
      return;
    }
    if (!nickname.trim()) {
      setFormError('닉네임을 입력해 주세요.');
      return;
    }
    const amount = parseAmount(amountStr);
    if (amount <= 0) {
      setFormError('모금액을 입력해 주세요.');
      return;
    }

    const newDonorData = {
      name: name.trim(),
      nickname: nickname.trim(),
      amount,
      date: new Date().toISOString().slice(0, 10), // Date string for display
      oneLineMsg: oneLineMsg.trim() || undefined,
      // Firestore will auto-generate 'id' and 'createdAt'
    };

    try {
      setLoadingFormSending(true);
      await addDonor(newDonorData); // Use your addDonor function
      setSuccessMsg(
        `${nickname.trim()}님의 ${formatKoreanAmount(amount)} 펀딩이 완료되었습니다. 진심으로 감사합니다!🥰`,
      );
      setName('');
      setNickname('');
      setAmountStr('');
      setOneLineMsg('');
      setTimeout(() => {
        setShowFundingForm(false);
      }, 2500);
    } catch (error) {
      console.error('Failed to add donor:', error);
      setFormError('펀딩 등록 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoadingFormSending(false);
    }
  };

  // Effect to calculate total funded amount whenever donors change
  useEffect(() => {
    if (!donors) return;
    const total = donors.reduce((sum, d) => sum + d.amount, 0);
    setFundedAmount(total);
  }, [donors]);

  // Effect to calculate funded amount and percentage
  useEffect(() => {
    if (fundedAmount === 0) return;
    const newPercentage = Math.min(
      Math.round((fundedAmount / GIFT_TOTAL) * 100),
      100,
    );
    setPercentage(newPercentage);
  }, [fundedAmount]);

  // Effect to subscribe to donors
  useEffect(() => {
    setLoadingDonors(true);
    const unsubscribe = subscribeToDonors((fetchedDonors) => {
      setDonors(fetchedDonors);
      setLoadingDonors(false);
      console.log('Fetched donors:', fetchedDonors);
    });

    // Cleanup the subscription when the component unmounts
    return () => unsubscribe();
  }, []); // Run once on component mount

  // Effect to scroll to form when it opens
  useEffect(() => {
    if (showFundingForm && formRef.current) {
      setTimeout(
        () =>
          formRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          }),
        100,
      );
    }
  }, [showFundingForm]);

  return (
    <div
      className='min-h-screen bg-background'
      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      {/* Header */}

      <div className='max-w-[480px] mx-auto px-4 pb-16 pt-6 flex flex-col gap-4'>
        {/* Gift Card */}
        <div className='bg-white rounded-xl overflow-hidden border border-border'>
          <div
            className='w-full'
            style={{ aspectRatio: '4/3', background: '#fff' }}
          >
            <img
              src={GIFT_IMAGE}
              alt='생일 선물 이미지'
              className='max-w-full max-h-full mx-auto'
            />
          </div>

          <div className='p-5'>
            <h1
              className='text-foreground mb-1 text-xl'
              style={{ fontWeight: 700 }}
            >
              {GIFT_NAME}
            </h1>
            <p className='text-muted-foreground text-sm mb-5'>
              목표 금액:{' '}
              <span className='text-primary font-medium'>
                {GIFT_TOTAL.toLocaleString()}원
              </span>
            </p>

            {/* Progress */}
            <div className='mb-1.5 flex justify-between items-center'>
              <span className='text-muted-foreground text-sm'>현재 모금액</span>
              <span
                className='text-primary font-bold'
                style={{ fontSize: '1.3rem' }}
              >
                {percentage}%
              </span>
            </div>
            <div className='w-full h-2.5 bg-muted rounded-full overflow-hidden mb-2'>
              <motion.div
                className='h-full rounded-full bg-primary'
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className='flex justify-between text-sm text-muted-foreground'>
              <span>
                <span style={{ color: '#2563eb', fontWeight: 600 }}>
                  {fundedAmount.toLocaleString()}원
                </span>{' '}
                모금됨
              </span>
              <span>{GIFT_TOTAL.toLocaleString()}원 목표</span>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div
          className='bg-white rounded-xl border border-border p-5 text-sm'
          style={{ lineHeight: '1.7' }}
        >
          <ul className='flex flex-col gap-2'>
            {[
              <span>김시식의 생일 선물을 위한 펀딩 사이트입니다.</span>,
              <span>
                펀딩 종료 후, 부족한 금액은 사비로 채워 구매 예정입니다.
              </span>,
              <span>
                <span style={{ color: '#dc2626', fontWeight: 600 }}>
                  ⚠️ 2만원 이상은 받지 않습니다 ‼️
                </span>{' '}
                (주인장 백수 이슈)
              </span>,
              <span>
                방문 해주신 마음만으로도 감사합니다 ☺️ 늘 건강하고 행복하세요♡
              </span>,
            ].map((item, i) => (
              <li key={i} className='flex gap-2 text-foreground'>
                <span className='text-primary mt-0.5 flex-shrink-0'>•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Account Info */}
        <div className='bg-white rounded-xl border border-border p-5'>
          <p
            className='text-muted-foreground text-xs mb-3 font-medium'
            style={{ letterSpacing: '0.05em' }}
          >
            계좌 정보
          </p>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-muted-foreground text-sm'>{ACCOUNT_BANK}</p>
              <p
                className='text-foreground'
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                {ACCOUNT_NUMBER}
              </p>
              <p className='text-muted-foreground text-sm'>
                예금주: {ACCOUNT_HOLDER}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 border`}
              style={{
                background: copied ? '#2563eb' : '#ffffff',
                color: copied ? '#ffffff' : '#2563eb',
                borderColor: '#2563eb',
                cursor: copied ? 'default' : 'pointer',
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? '복사됨' : '계좌 복사'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3 items-end'>
          <button
            onClick={() => {
              setShowFundingForm((v) => !v);
              setSuccessMsg('');
              setFormError('');
            }}
            className='flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-150 border'
            style={{
              background: '#2563eb',
              color: '#ffffff',
              borderColor: '#2563eb',
              cursor: 'pointer',
            }}
          >
            <Heart size={15} fill='white' />
            펀딩하기
            {showFundingForm ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>
        </div>

        {/* Funding Form */}
        <AnimatePresence>
          {showFundingForm && (
            <motion.div
              ref={formRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className='bg-white rounded-xl border border-border p-5 flex flex-col gap-4 relative'
              style={{
                // Disable pointer events while loading form submission
                pointerEvents: loadingFormSending ? 'none' : 'auto',
                overflow: 'hidden',
              }}
            >
              {loadingFormSending && <Spinner />}
              {loadingFormSending && (
                <div
                  className='absolute inset-0 z-9'
                  style={{
                    background: 'rgba(255, 255, 255, 0.5)',
                  }}
                ></div>
              )}
              <h2
                className='text-foreground'
                style={{ fontSize: '0.95rem', fontWeight: 700 }}
              >
                펀딩 참여하기
              </h2>

              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-foreground'>
                  이름
                </label>
                <input
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='이름 입력'
                  className='w-full px-4 py-3 rounded-lg border outline-none text-foreground placeholder-muted-foreground'
                  style={{
                    borderColor: 'rgba(37,99,235,0.2)',
                    background: '#f0f4ff',
                    fontSize: '0.95rem',
                  }}
                />
                <p className='text-xs text-muted-foreground'>
                  입금인 확인을 위해 정확히 입력해 주세요.
                </p>
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-foreground'>
                  닉네임
                </label>
                <input
                  type='text'
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder='닉네임 입력'
                  className='w-full px-4 py-3 rounded-lg border outline-none text-foreground placeholder-muted-foreground'
                  style={{
                    borderColor: 'rgba(37,99,235,0.2)',
                    background: '#f0f4ff',
                    fontSize: '0.95rem',
                  }}
                />
                <p className='text-xs text-muted-foreground'>
                  <span className='text-primary font-medium'>닉네임</span>이
                  후원자 명단에 표기됩니다. 이름은 표기되지 않습니다.
                </p>
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-foreground'>
                  모금액
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    inputMode='numeric'
                    value={amountStr}
                    onChange={handleAmountChange}
                    placeholder='0'
                    className='w-full px-4 py-3 rounded-lg border outline-none text-foreground placeholder-muted-foreground pr-8'
                    style={{
                      borderColor: 'rgba(34, 45, 67, 0.2)',
                      background: '#f0f4ff',
                      fontSize: '0.95rem',
                    }}
                  />
                  <span className='absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm'>
                    원
                  </span>
                </div>
                {amountStr && parseAmount(amountStr) > 0 && (
                  <p className='text-xs text-primary'>
                    {formatKoreanAmount(parseAmount(amountStr))}
                  </p>
                )}
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-foreground'>
                  한줄 메세지
                  <span
                    className='text-muted-foreground font-normal ml-1.5'
                    style={{ fontSize: '0.78rem' }}
                  >
                    (선택)
                  </span>
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    value={oneLineMsg}
                    onChange={(e) => {
                      if (e.target.value.length <= 150)
                        setOneLineMsg(e.target.value);
                    }}
                    placeholder='후원자 명단에 함께 표시됩니다.'
                    className='w-full px-4 py-3 rounded-lg border outline-none text-foreground placeholder-muted-foreground pr-14'
                    style={{
                      borderColor: 'rgba(37,99,235,0.2)',
                      background: '#f0f4ff',
                      fontSize: '0.95rem',
                    }}
                  />
                  <span
                    className='absolute right-4 top-1/2 -translate-y-1/2 text-xs'
                    style={{
                      color: oneLineMsg.length >= 130 ? '#2563eb' : '#6b7fa3',
                    }}
                  >
                    {oneLineMsg.length}/150
                  </span>
                </div>
              </div>

              {formError && (
                <p className='text-sm text-destructive bg-red-50 px-3 py-2 rounded-lg border border-red-100'>
                  {formError}
                </p>
              )}

              <button
                onClick={handleFundingSubmit}
                className='w-full py-3 rounded-lg font-medium text-white transition-all duration-150'
                style={{
                  background: '#2563eb',
                  cursor: 'pointer',
                }}
              >
                펀딩 완료
              </button>
            </motion.div>
          )}
          {successMsg && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='text-sm text-primary bg-secondary px-3 py-2 rounded-lg border border-border text-center font-medium'
            >
              {successMsg}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Donor List */}
        <div className='bg-white rounded-xl border border-border p-5'>
          <h2
            className='text-foreground mb-4 flex items-center gap-2'
            style={{ fontSize: '0.95rem', fontWeight: 700 }}
          >
            <Heart size={14} className='text-primary' fill='#2563eb' />
            후원자 명단
            <span className='ml-auto text-xs text-muted-foreground font-normal'>
              {donors?.length}명 참여
            </span>
          </h2>

          {loadingDonors ? (
            <div role='status' className='max-w-sm animate-pulse'>
              <div className='h-2.5 bg-gray-200 rounded-full w-48 mb-4'></div>
              <div className='h-2 bg-gray-200 rounded-full max-w-[360px] mb-2.5'></div>
              <div className='h-2 bg-gray-200 rounded-full mb-2.5'></div>
              <span className='sr-only'>Loading...</span>
            </div>
          ) : donors?.length === 0 ? (
            <p className='text-center text-muted-foreground text-sm py-4'>
              첫 번째 후원자가 되어주세요🫶
            </p>
          ) : (
            <div className='flex flex-col gap-3'>
              {donors?.map((donor) => (
                <div key={donor.id} className='flex flex-col'>
                  {/* Donor row */}
                  <div
                    className='flex items-center gap-2.5 py-2.5 px-3 rounded-lg'
                    style={{ background: '#f4f7fb' }}
                  >
                    <div
                      className='w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0'
                      style={{ background: '#e2e8f0' }}
                    >
                      <User size={15} style={{ color: '#94a3b8' }} />
                    </div>
                    <div className='flex items-center justify-between flex-1'>
                      <p className='text-foreground text-sm font-medium'>
                        {donor.nickname}
                      </p>
                      <p
                        className='text-muted-foreground'
                        style={{ fontSize: '0.72rem', color: '#94a3b8' }}
                      >
                        {formatTimestamp(donor.date)}
                      </p>
                    </div>
                  </div>

                  {/* Speech bubble if oneLineMsg exists */}
                  {donor.oneLineMsg && (
                    <div className='ml-10 -mt-2 relative z-10'>
                      {/* upward tail */}
                      <div
                        style={{
                          position: 'relative',
                          display: 'inline-block',
                          maxWidth: 'calc(100% - 1rem)',
                        }}
                      >
                        <div
                          className='px-3 py-1.5 rounded-lg rounded-tl-none'
                          style={{
                            background: '#ffffff',
                            color: '#94a3b8',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.72rem',
                            lineHeight: '1.5',
                          }}
                        >
                          {donor.oneLineMsg}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
