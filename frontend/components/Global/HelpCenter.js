import React, { useState, useEffect } from 'react';
import styled, { keyframes, useTheme } from 'styled-components';
import { useRouter } from 'next/router';
import Documentation from './HelpCenter/Documentation';
import Walkthrough from './HelpCenter/Walkthrough';
import LanguageSelector from '../LanguageSelector';
import { StyledInput } from '../styles/StyledForm';
import { StyledAdaptableButton } from '../styles/StyledProfile';
import { useQuery, useMutation } from '@apollo/client';
import { CURRENT_USER_QUERY } from '../Queries/User';
import { UPDATE_USER } from '../Mutations/User';
import useTranslation from "next-translate/useTranslation";
import {
  HelpButton,
  ActionsList,
  ActionItem,
  ActionButton,
  ActionLabel,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  CloseButton,
  DocSection,
  Support,
  fadeInUp,
  scaleIn
} from './HelpCenter/HelpCenterStyles';

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
        tooltip: t('helpCenter.walkthrough'),
        bgColor: theme.primaryBlue,
        action: () => openModal(t('helpCenter.walkthroughTutorial'), 'walkthrough'),
        allowedRoles: ["ADMIN", "MENTOR", "SCIENTIST", "TEACHER"]
      },
      {
        icon: '/assets/helpCenter/docs.svg',
        tooltip: t('helpCenter.documentation'),
        bgColor: theme.primaryCalyspo,
        action: () => openModal(t('helpCenter.documentation'), 'docs'),
        // allowedRoles: undefined (visible to all)
    },
      {
        icon: '/assets/helpCenter/support.svg',
        tooltip: t('helpCenter.reportIssue'),
        bgColor: theme.primaryRed,
        action: () => openModal(t('helpCenter.reportIssue'), 'report'),
        allowedRoles: ["ADMIN", "MENTOR", "SCIENTIST", "TEACHER"]
      },
      {
        icon: '/assets/helpCenter/aichat.svg',
        tooltip: t('helpCenter.aiAssist'),
        bgColor: theme.primaryYellow,
        action: () => openModal(t('helpCenter.aiAssist'), 'aiassist'),
        allowedRoles: ["ADMIN"]
      },
      {
        icon: '/assets/helpCenter/language.svg',
        tooltip: t('helpCenter.language'),
        bgColor: theme.secondaryPurple,
        action: () => openModal(t('helpCenter.language'), 'language'),
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
        return <Walkthrough onStartWalkthrough={() => {
          setModalOpen(false);
          setTimeout(() => {
            window.dispatchEvent(new Event('start-walkthrough-tour'));
          }, 300); // Give modal time to close
        }} />;
      case 'docs':
        return (
            <>
                <Documentation />
                <DocSection>
                    <div className="doc-item">
                    <h4>{t('helpCenter.generalPlatformGuide')}</h4>
                    <p>
                      <a href="https://docs.google.com/document/d/1wchcGV14rE2JKXpyOdQ5pLkj-7NEfXWwfS-MdxK8bqI/edit?tab=t.0" target="_blank" rel="noopener noreferrer">
                        {t('helpCenter.platformGuideLink')}
                      </a>
                    </p>
                    </div>
                </DocSection>
            </>
        );
      case 'report':
        return (
          <Support>
            <div className="report-item">
              <div className="report-icon">🎟️</div>
              <div className="report-details">
                <div>
                    <a href="https://mindhive.notion.site/153d80abf4c48093b13cc8d50807c7b8?pvs=105" target="_blank">
                    <button className="primaryBtn" style={{ border: `1px solid ${modalColor}`, background: modalColor }}>
                        {t("helpCenter.fillSupportTicket")}
                    </button>
                    </a>
                </div>
              </div>
            </div>
            
            <div className="report-item">
                <div className="report-icon">🧱</div>
                <div className="report-details">
                <div>
                    <a href="https://mindhive.notion.site/18bd80abf4c480749952e3c0498fab29?pvs=105" target="_blank">
                    <button className="primaryBtn" style={{ border: `1px solid ${modalColor}`, background: modalColor }}>
                        {t("helpCenter.fillRequestForm")}
                    </button>
                    </a>
                </div>
                </div>
            </div>
            <div className="report-item">
              <div className="report-icon">📮</div>
              <div className="report-details">
                <h4>{t('helpCenter.urgentMattersEmail')}</h4>
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
            <p>{t('helpCenter.aiComingSoon')}</p>
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
                {saving ? t('helpCenter.saving') : t('helpCenter.saveLanguage')}
            </StyledAdaptableButton>
          </StyledInput>
        );
      default:
        return <p>{t('helpCenter.contentNotAvailable')}</p>;
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
                {t('helpCenter.close')}
              </button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}