import React, { useState, useEffect } from 'react';
import styled, { keyframes, useTheme } from 'styled-components';
import { useRouter } from 'next/router';
import Documentation from './HelpCenter/Documentation';
import LanguageSelector from '../LanguageSelector';
import { StyledInput } from '../styles/StyledForm';
import { StyledAdaptableButton } from '../styles/StyledProfile';
import { useQuery, useMutation } from '@apollo/client';
import { CURRENT_USER_QUERY } from '../Queries/User';
import { UPDATE_USER } from '../Mutations/User';
import useTranslation from "next-translate/useTranslation";
// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(1);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

// Styled Components
const HelpButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.theme.primaryGreen};
  border: none;
  box-shadow: ${props => props.theme.bs};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  transition: all 0.3s ease;
  z-index: 1000;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 16px 32px 0 rgba(0, 0, 0, 0.15);
  }

//   ${props => props.isOpen && `
//     transform: rotate(45deg);
//   `}
`;

const ActionsList = styled.div`
  position: fixed;
  bottom: 80px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 999;
`;

const ActionItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  animation: ${fadeInUp} 0.3s ease forwards;
  animation-delay: ${props => props.delay}ms;
  opacity: 0;
`;

const ActionButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.bgColor || props.theme.primaryGreen};
  border: none;
  box-shadow: ${props => props.theme.bs};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 24px 0 rgba(0, 0, 0, 0.15);
  }
`;

const ActionLabel = styled.span`
  background: white;
  padding: 8px 16px;
  border-radius: 25px;
  color: var(--MH-Theme-Neutrals-Black, #171717);

  /* MH-Theme/body/small */
  font-family: "Nunito Sans", sans-serif;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 16px; /* 133.333% */

  box-shadow: ${props => props.theme.bs};
  white-space: nowrap;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1001;
  animation: ${scaleIn} 0.3s ease;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px 0 rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  
  color: ${props => props.theme.neutral5};
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: between;
  gap: 12px;
  
  h2 {
    font-family: 'Lato', sans-serif;
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    flex: 1;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
`;

const ModalFooter = styled.div`
  padding: 20px;
  border-top: 1px solid ${props => props.theme.accentGreen};
  background: ${props => props.theme.offWhite};
  .primaryBtn {
    margin-left: 10px;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
`;

const DocSection = styled.div`
  .doc-item {
    background: ${props => props.theme.offWhite};
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 12px;
    border-left: 4px solid ${props => props.theme.primaryGreen};
    
    h4 {
      margin: 0 0 8px 0;
      color: ${props => props.theme.black};
      font-family: 'Lato', sans-serif;
    }
    
    p {
      margin: 0;
      font-size: 14px;
    }
  }
`;

const Support = styled.div`
  .primaryBtn {
    margin-left: 10px;
  }

  .report-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: ${props => props.theme.neutral5};
    border-radius: 6px;
    margin-bottom: 12px;
    
    .report-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
    }
    
    .report-details {
      h4 {
        margin: 0 0 4px 0;
        color: ${props => props.theme.neutral1};
        font-family: 'Lato', sans-serif;
      }
      
      p {
        margin: 0;
        font-size: 14px;
      }
    }
  }
`;

export default function HelpCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalColor, setModalColor] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [changed, setChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation("home");

  const theme = useTheme();
  const router = useRouter();
  const currentLanguage = router.locale?.toUpperCase() || "EN-US";
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

  // Fetch current user data
  const { data: userData } = useQuery(CURRENT_USER_QUERY);
  const user = userData?.authenticatedItem;

  const [updateProfile] = useMutation(UPDATE_USER, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  useEffect(() => {
    setSelectedLanguage(currentLanguage);
    setChanged(false);
  }, [currentLanguage, modalOpen]); // reset when modal opens or language changes

  const handleLanguageChange = (event) => {
    const newLocale = event.target.value;
    setSelectedLanguage(newLocale);
    setChanged(newLocale !== currentLanguage);
  };

  const handleSaveLanguage = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!user?.id) throw new Error('No user id');
      await updateProfile({ variables: { id: user.id, language: selectedLanguage } });
      const { pathname, asPath, query } = router;
      await router.push({ pathname, query }, asPath, { locale: selectedLanguage.toLowerCase() });
      setChanged(false);
    } catch (err) {
        console.log('handleSaveLanguage: error', err);
    }
    setSaving(false);
  };

  function getActions(user, theme, openModal) {
    const permissions = user?.permissions?.map((p) => p?.name) || ['UNAUTHENTICATED'];
    //Existing roles: ["ADMIN", "STUDENT", "MENTOR", "SCIENTIST", "TEACHER", "UNAUTHENTICATED", "PARTICIPANT"]

    const actions = [
      {
        icon: '/assets/helpCenter/walkthrough.svg',
        tooltip: 'Walkthrough',
        bgColor: theme.primaryBlue,
        action: () => openModal('Walkthrough Tutorial', 'walkthrough'),
        // allowedRoles: undefined (visible to all)
      },
      {
        icon: '/assets/helpCenter/docs.svg',
        tooltip: 'Documentation',
        bgColor: theme.primaryCalyspo,
        action: () => openModal('Documentation', 'docs'),
        // allowedRoles: undefined (visible to all)
    },
      {
        icon: '/assets/helpCenter/support.svg',
        tooltip: 'Report Issue',
        bgColor: theme.primaryRed,
        action: () => openModal('Report Issue', 'report'),
        allowedRoles: ["ADMIN", "MENTOR", "SCIENTIST", "TEACHER"]
      },
      {
        icon: '/assets/helpCenter/aichat.svg',
        tooltip: 'Ai Assist',
        bgColor: theme.primaryYellow,
        action: () => openModal('Ai Assist', 'aiassist'),
        allowedRoles: ["ADMIN"]
      },
      {
        icon: '/assets/helpCenter/language.svg',
        tooltip: 'Language',
        bgColor: theme.secondaryPurple,
        action: () => openModal('Language', 'language'),
        // allowedRoles: undefined (visible to all)
      }
    ];
    return actions.filter(action => {
      if (action.allowedRoles) {
        return permissions.some(p => action.allowedRoles.includes(p));
      }
      return true;
    });
  }

  const openModal = (title, type) => {
    setModalTitle(title);
    setModalType(type);
    setModalColor(getColor(type, theme));
    setModalOpen(true);
    setIsOpen(false);
  };

  const getColor = (type, theme) => {
    switch (type) {
      case 'walkthrough':
        return theme.primaryBlue;
      case 'docs':
        return theme.primaryCalyspo;
      case 'report':
        return theme.primaryRed;
      case 'aiassist':
        return theme.neutral1;
      case 'language':
        return theme.secondaryPurple;
      default:
        return theme.neutral1; // fallback
    }
  };

  const getContent = (type) => {
    switch (type) {
      case 'walkthrough':
        return (
            <p>Explore Walkthroughs soon! 🧗🏼‍♂️</p>
        );
      case 'docs':
        return (
            <>
                <DocSection>
                    <div className="doc-item">
                    <h4>General Platform Guide</h4>
                    <p><a herf="perdu.com" target='_blank'>You can see our general platform guide by clicking this link!</a></p>
                    </div>
                </DocSection>
                <Documentation />
            </>
        );
      case 'report':
        return (
          <Support>
            <div className="report-item">
              <div className="report-icon">🎟️</div>
              <div className="report-details">
                <div>
                    {/* {t("fillRequestForm")} pour un new block<br></br> */}
                    <a href="https://mindhive.notion.site/153d80abf4c48093b13cc8d50807c7b8?pvs=105" target="_blank">
                    <button className="primaryBtn" style={{ border: `1px solid ${modalColor}`, background: modalColor }}>
                        {t("fillSupportTicket")}
                    </button>
                    </a>
                </div>
              </div>
            </div>
            
            <div className="report-item">
                <div className="report-icon">🧱</div>
                <div className="report-details">
                <div>
                    {/* {t("fillRequestForm")} pour un new block<br></br> */}
                    <a href="https://mindhive.notion.site/18bd80abf4c480749952e3c0498fab29?pvs=105" target="_blank">
                    <button className="primaryBtn" style={{ border: `1px solid ${modalColor}`, background: modalColor }}>
                        {t("fillRequestForm")}
                    </button>
                    </a>
                </div>
                </div>
            </div>
            <div className="report-item">
              <div className="report-icon">📮</div>
              <div className="report-details">
                <h4>For urgent matters, email us!</h4>
                <p>
                    <a href="mailto:support.mindhive@nyu.edu">support.mindhive@nyu.edu</a><br />
                </p>
              </div>
            </div>
          </Support>
        );
      case 'aiassist':
        return (
          <div>
            <p>Here comes the ai ✨</p>
          </div>
        );
      case 'language':
        return (
          <StyledInput>
            <div style={{ marginBottom: '16px' }}>
              <LanguageSelector
                handleChange={handleLanguageChange}
                value={selectedLanguage}
              />
            </div>
            <StyledAdaptableButton 
              onClick={handleSaveLanguage} 
              disabled={!changed || saving}
              color={theme.secondaryPurple}
              changed={changed} >
                {saving ? 'Saving...' : 'Save Language'}
            </StyledAdaptableButton>
          </StyledInput>
        );
      default:
        return <p>Content not available.</p>;
    }
  };

  return (
    <>
      {/* Speed Dial Actions */}
      {isOpen && (
        <ActionsList>
          {getActions(user, theme, openModal).map((action, index) => (
            <ActionItem key={action.tooltip} delay={index * 100}>
              <ActionLabel>{action.tooltip}</ActionLabel>
              <ActionButton 
                bgColor={action.bgColor}
                onClick={action.action}
              >
                {/* {action.icon} */}
                <img src={action.icon} alt={action.tooltip} width="22" height="22" />
              </ActionButton>
            </ActionItem>
          ))}
        </ActionsList>
      )}

      {/* Main Help Button */}
      <HelpButton 
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕' : '?'}
      </HelpButton>

      {/* Modal */}
      {modalOpen && (
        <Modal onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <ModalContent>
            <ModalHeader style={{ background: modalColor }}>
              <h2>{modalTitle}</h2>
              <CloseButton onClick={() => setModalOpen(false)}>
                ✕
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              {getContent(modalType)}
            </ModalBody>
            <ModalFooter>
              <button className="primaryBtn" style={{ border: `1px solid ${modalColor}`, background: modalColor }} onClick={() => setModalOpen(false)}>
                Close
              </button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}