/**
 * Patient Card Component
 * Displays patient information with Sudan-specific fields
 * Supports Arabic RTL layout
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Cake as CakeIcon,
  Wc as GenderIcon,
  Language as LanguageIcon,
  Badge as BadgeIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

export interface PatientCardProps {
  patient: {
    id: string;
    mrn: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other' | 'unknown';
    sudanNationalId?: string;
    phone?: string;
    email?: string;
    city?: string;
    state?: string;
    country?: string;
    primaryLanguage?: string;
    bloodType?: string;
    isActive?: boolean;
    photoUrl?: string;
  };
  onEdit?: () => void;
  onView?: () => void;
  showSensitiveData?: boolean; // Show Sudan National ID
  compact?: boolean;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onEdit,
  onView,
  showSensitiveData = false,
  compact = false
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const fullName = `${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`.trim();
  
  const age = React.useMemo(() => {
    const birthDate = parseISO(patient.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, [patient.dateOfBirth]);

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male':
        return '♂️';
      case 'female':
        return '♀️';
      default:
        return '⚧';
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'info';
      case 'female':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const maskSudanNationalId = (nationalId: string): string => {
    if (nationalId.length > 5) {
      const first = nationalId.substring(0, 3);
      const last = nationalId.substring(nationalId.length - 2);
      const masked = '*'.repeat(nationalId.length - 5);
      return `${first}${masked}${last}`;
    }
    return nationalId;
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        direction: isRTL ? 'rtl' : 'ltr',
        borderRadius: 2,
        boxShadow: 2,
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease-in-out'
        }
      }}
    >
      <CardHeader
        avatar={
          <Avatar
            src={patient.photoUrl}
            sx={{ 
              width: compact ? 40 : 56, 
              height: compact ? 40 : 56,
              bgcolor: 'primary.main'
            }}
          >
            {!patient.photoUrl && <PersonIcon />}
          </Avatar>
        }
        action={
          <IconButton onClick={onEdit}>
            <MoreVertIcon />
          </IconButton>
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant={compact ? 'h6' : 'h5'} component="div">
              {fullName}
            </Typography>
            <Chip
              label={getGenderIcon(patient.gender)}
              color={getGenderColor(patient.gender) as any}
              size="small"
            />
          </Box>
        }
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Chip
              icon={<BadgeIcon />}
              label={`${t('mrn')}: ${patient.mrn}`}
              size="small"
              variant="outlined"
            />
            {patient.bloodType && (
              <Chip
                label={`${t('bloodType')}: ${patient.bloodType}`}
                size="small"
                color="error"
                variant="outlined"
              />
            )}
            {patient.isActive !== undefined && (
              <Chip
                label={patient.isActive ? t('active') : t('inactive')}
                size="small"
                color={patient.isActive ? 'success' : 'default'}
              />
            )}
          </Box>
        }
      />

      <CardContent>
        <Grid container spacing={2}>
          {/* Date of Birth & Age */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CakeIcon color="action" fontSize="small" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('dateOfBirth')}
                </Typography>
                <Typography variant="body2">
                  {format(parseISO(patient.dateOfBirth), 'dd/MM/yyyy')} ({age} {t('years')})
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Gender */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GenderIcon color="action" fontSize="small" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('gender')}
                </Typography>
                <Typography variant="body2">
                  {t(`gender.${patient.gender}`)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Sudan National ID */}
          {patient.sudanNationalId && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BadgeIcon color="action" fontSize="small" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('sudanNationalId')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {showSensitiveData 
                      ? patient.sudanNationalId 
                      : maskSudanNationalId(patient.sudanNationalId)
                    }
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Phone */}
          {patient.phone && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon color="action" fontSize="small" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('phone')}
                  </Typography>
                  <Typography variant="body2" dir="ltr">
                    {patient.phone}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Email */}
          {patient.email && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon color="action" fontSize="small" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('email')}
                  </Typography>
                  <Typography variant="body2" dir="ltr">
                    {patient.email}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Location */}
          {(patient.city || patient.state) && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon color="action" fontSize="small" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('location')}
                  </Typography>
                  <Typography variant="body2">
                    {[patient.city, patient.state, patient.country].filter(Boolean).join(', ')}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Primary Language */}
          {patient.primaryLanguage && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LanguageIcon color="action" fontSize="small" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('primaryLanguage')}
                  </Typography>
                  <Typography variant="body2">
                    {t(`language.${patient.primaryLanguage.toLowerCase()}`)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PatientCard;
