import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Cherry, 
  Gamepad2, 
  Search, 
  Crown, 
  Flame, 
  ShieldAlert, 
  Sword, 
  Compass, 
  Heart,
  Droplet,
  Sparkles,
  Lock,
  UserCheck,
  ShoppingBag,
  Hammer,
  Shield,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const API_BASE = window.location.origin.includes('5173') ? 'http://localhost:3000' : '';

const RECIPES_CATALOG = [
  { id: 'iron_sword', name: 'Iron Sword', type: 'Forge', emoji: '⚔️', req: 'Smithing Lvl 1', mats: { 'Iron Ore': 5, 'Twig': 2 }, desc: '+5 STR Weapon' },
  { id: 'oak_bow', name: 'Oak Bow', type: 'Forge', emoji: '🏹', req: 'Smithing Lvl 5', mats: { 'Oak Wood': 6, 'Twig': 4 }, desc: '+5 DEX Weapon' },
  { id: 'magic_staff', name: 'Magic Staff', type: 'Forge', emoji: '🔮', req: 'Smithing Lvl 10', mats: { 'Magic Wood': 4, 'Coal': 2 }, desc: '+5 INT Weapon' },
  { id: 'gold_sword', name: 'Gold Sword', type: 'Forge', emoji: '🔱', req: 'Smithing Lvl 15', mats: { 'Gold Ore': 4, 'Twig': 2 }, desc: '+8 STR Weapon' },
  { id: 'wooden_shield', name: 'Wooden Shield', type: 'Forge', emoji: '🛡️', req: 'Smithing Lvl 1', mats: { 'Pine Wood': 6, 'Twig': 2 }, desc: '+3 DEF Shield' },
  { id: 'plated_shield', name: 'Plated Shield', type: 'Forge', emoji: '🧱', req: 'Smithing Lvl 8', mats: { 'Iron Ore': 8, 'Pine Wood': 4 }, desc: '+6 DEF Shield' },
  { id: 'gold_ring', name: 'Gold Ring', type: 'Forge', emoji: '💍', req: 'Smithing Lvl 12', mats: { 'Gold Ore': 2, 'Diamond': 1 }, desc: '+5 LUC Ring' },
  { id: 'health_potion', name: 'Health Potion', type: 'Brew', emoji: '🧪', req: 'Alchemy Lvl 1', mats: { 'Seaweed': 3 }, desc: 'Restores 50 HP' },
  { id: 'mana_potion', name: 'Mana Potion', type: 'Brew', emoji: '🌀', req: 'Alchemy Lvl 3', mats: { 'Coal': 2, 'Seaweed': 1 }, desc: 'Restores 40 MP' },
  { id: 'seared_steak', name: 'Seared Steak', type: 'Cook', emoji: '🥩', req: 'Cooking Lvl 1', mats: { 'Raw Meat': 2 }, desc: 'Restores 60 HP. Ideal Stove Flame: High heat.' },
  { id: 'baked_salmon', name: 'Baked Salmon', type: 'Cook', emoji: '🐟', req: 'Cooking Lvl 3', mats: { 'Raw Fish': 2 }, desc: 'Restores 50 HP, 10 MP. Ideal Stove Flame: Low heat.' },
  { id: 'gourmet_feast', name: 'Gourmet Feast', type: 'Cook', emoji: '🍱', req: 'Cooking Lvl 8', mats: { 'Raw Meat': 1, 'Raw Fish': 1, 'Wheat': 1 }, desc: 'Restores 100 HP, 30 MP. Ideal Stove Flame: Medium heat.' }
];

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ totalPlayers: 0, circulatingWealth: 0, slotsJackpot: 5000, activeGuilds: 0 });
  const [leaderboard, setLeaderboard] = useState({ wealth: [], combat: [] });
  const [stocksData, setStocksData] = useState({ stocks: [], news: [] });
  const [selectedStock, setSelectedStock] = useState(null);
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Web Auth & Interactive Actions
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loggedInCharName, setLoggedInCharName] = useState('');
  const [myPlots, setMyPlots] = useState([]);
  const [myInventory, setMyInventory] = useState([]);
  const [selectedSeed, setSelectedSeed] = useState({ 1: 'Wheat', 2: 'Wheat', 3: 'Wheat' });
  const [spinResult, setSpinResult] = useState(null);
  const [webHeatLevels, setWebHeatLevels] = useState({});

  // Marketplace & Active Raid states
  const [listings, setListings] = useState([]);
  const [activeRaid, setActiveRaid] = useState({ active: false });

  // Custom added features states
  const [isAdmin, setIsAdmin] = useState(false);
  const [equippedWeapon, setEquippedWeapon] = useState(null);
  const [equippedShield, setEquippedShield] = useState(null);
  const [shopCatalog, setShopCatalog] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [adminSettings, setAdminSettings] = useState({ welcomeMsg: '', leaveMsg: '', autoRole: '' });
  const [adminTargetUser, setAdminTargetUser] = useState('');
  const [adminAmount, setAdminAmount] = useState(100);
  const [adminAction, setAdminAction] = useState('give');

  const [selectedLeaderboardSkill, setSelectedLeaderboardSkill] = useState('combat');
  const [skillLeaderboardList, setSkillLeaderboardList] = useState([]);
  const [homesteadData, setHomesteadData] = useState({ house: null, properties: [], dinoPark: null, aquarium: null });

  // New Professional Features State
  const [myPortfolio, setMyPortfolio] = useState([]);
  const [stockSharesInput, setStockSharesInput] = useState('');
  const [selectedDungeon, setSelectedDungeon] = useState('goblin');
  const [combatLog, setCombatLog] = useState('');
  const [combatActive, setCombatActive] = useState(false);
  const [combatResult, setCombatResult] = useState(null);
  const [isCombatLoading, setIsCombatLoading] = useState(false);
  const [dungeonSession, setDungeonSession] = useState(null);
  const [farmAnimals, setFarmAnimals] = useState(null);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [enhanceBaseName, setEnhanceBaseName] = useState('Iron Sword');
  const [enhanceStatus, setEnhanceStatus] = useState(null);
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [enhanceOutcome, setEnhanceOutcome] = useState(null);
  const [craftSubTab, setCraftSubTab] = useState('recipes');
  const [listMarketItem, setListMarketItem] = useState('');
  const [listMarketQty, setListMarketQty] = useState(1);
  const [listMarketPrice, setListMarketPrice] = useState(100);
  const [adminSpawnItem, setAdminSpawnItem] = useState('Iron Ore');
  const [adminSpawnQty, setAdminSpawnQty] = useState(5);
  const [adminNoticeTitle, setAdminNoticeTitle] = useState('');
  const [adminNoticeContent, setAdminNoticeContent] = useState('');

  // Guild & Interactive Boss Raid state
  const [myGuild, setMyGuild] = useState(null);
  const [guildDepositInput, setGuildDepositInput] = useState('');

  const fetchMyGuild = (userId) => {
    fetch(`${API_BASE}/api/guild/my/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setMyGuild(data);
      })
      .catch(err => console.error('Guild fetch error:', err));
  };

  // Pet, Business Tycoon, and Delivery Logistics states
  const [myPet, setMyPet] = useState(null);
  const [myBusinesses, setMyBusinesses] = useState([]);
  const [deliveryCompany, setDeliveryCompany] = useState(null);
  const [deliveryJobs, setDeliveryJobs] = useState([]);
  const [adoptPetName, setAdoptPetName] = useState('');
  const [adoptPetType, setAdoptPetType] = useState('Dog');

  const fetchMyPet = (userId) => {
    fetch(`${API_BASE}/api/pet/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setMyPet(data.pet);
      })
      .catch(err => console.error('Pet fetch error:', err));
  };

  const fetchMyBusinesses = (userId) => {
    fetch(`${API_BASE}/api/business/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setMyBusinesses(data.list || []);
      })
      .catch(err => console.error('Business fetch error:', err));
  };

  const fetchDeliveryStatus = (userId) => {
    fetch(`${API_BASE}/api/delivery/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDeliveryCompany(data.company);
          setDeliveryJobs(data.activeJobs || []);
        }
      })
      .catch(err => console.error('Delivery fetch error:', err));
  };

  // Dino Park, Aquarium, and Casino Blackjack/Slots states
  const [dinoPark, setDinoPark] = useState(null);
  const [aquariumData, setAquariumData] = useState(null);
  const [slotsResult, setSlotsResult] = useState(null);
  const [slotsBetInput, setSlotsBetInput] = useState('100');
  const [slotsJackpotVal, setSlotsJackpotVal] = useState(5000);
  const [slotsSpinning, setSlotsSpinning] = useState(false);
  const [slotsSymbols, setSlotsSymbols] = useState(['🍒', '🍒', '🍒']);
  const [bjGameState, setBjGameState] = useState(null);
  const [bjBetInput, setBjBetInput] = useState('100');
  const [casinoSubTab, setCasinoSubTab] = useState('wheel'); // 'wheel', 'slots', 'blackjack'
  const [petAdventureResult, setPetAdventureResult] = useState(null);
  const [petRemainingTime, setPetRemainingTime] = useState(0);

  useEffect(() => {
    if (!myPet || myPet.status !== 'Adventure' || !myPet.lastAction) {
      setPetRemainingTime(0);
      return;
    }

    const duration = 60 * 1000; // 1 minute
    const endsAt = myPet.lastAction + duration;

    const updateTimer = () => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
      setPetRemainingTime(left);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [myPet]);

  // AI Operations Hub states
  const [aiHubTab, setAiHubTab] = useState('chat'); // 'chat', 'moderate', 'summarize', 'translate', 'starter'
  const [aiChatMessages, setAiChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your AI Server Assistant. Ask me anything about companion care, business profits, guild raids, or general FAQs!' }
  ]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatMode, setAiChatMode] = useState('faq'); // 'faq' or 'assistant'
  const [aiModText, setAiModText] = useState('');
  const [aiModResult, setAiModResult] = useState(null);
  const [aiSumText, setAiSumText] = useState('');
  const [aiSumType, setAiSumType] = useState('log'); // 'log' or 'ticket'
  const [aiSumResult, setAiSumResult] = useState('');
  const [aiTransText, setAiTransText] = useState('');
  const [aiTransLang, setAiTransLang] = useState('es'); // 'es', 'fr', 'ja'
  const [aiTransResult, setAiTransResult] = useState(null);
  const [aiStarterCategory, setAiStarterCategory] = useState('RPG'); // 'RPG', 'Business', 'Companion', 'Guild'
  const [aiStarterResult, setAiStarterResult] = useState([]);

  // Server Moderation and Protection states
  const [securitySettings, setSecuritySettings] = useState({
    antiRaid: true,
    antiNuke: true,
    antiSpam: true,
    antiScam: true,
    antiLink: false,
    antiMention: true
  });
  const [activePunishments, setActivePunishments] = useState([]);
  const [inviteLogs, setInviteLogs] = useState([]);
  const [punishUserId, setPunishUserId] = useState('');
  const [punishType, setPunishType] = useState('jail'); // 'ban', 'mute', 'jail'
  const [punishDuration, setPunishDuration] = useState('10');
  const [punishReason, setPunishReason] = useState('');

  const fetchSecuritySettings = (userId) => {
    fetch(`${API_BASE}/api/security/settings/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSecuritySettings(data.settings);
          setActivePunishments(data.punishments || []);
          setInviteLogs(data.invites || []);
        }
      })
      .catch(err => console.error('Security fetch error:', err));
  };
  // Community Hub states
  const [communityData, setCommunityData] = useState(null);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptA, setNewPollOptA] = useState('');
  const [newPollOptB, setNewPollOptB] = useState('');
  const [confessInput, setConfessInput] = useState('');
  const [dailyAnswerInput, setDailyAnswerInput] = useState('');
  const [goalContribAmount, setGoalContribAmount] = useState('500');

  const fetchCommunityData = (userId) => {
    fetch(`${API_BASE}/api/community/data/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCommunityData(data);
        }
      })
      .catch(err => console.error('Community fetch error:', err));
  };

  // Analytics Suite states
  const [analyticsData, setAnalyticsData] = useState(null);

  const fetchAnalyticsData = (userId) => {
    fetch(`${API_BASE}/api/analytics/data/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAnalyticsData(data);
        }
      })
      .catch(err => console.error('Analytics fetch error:', err));
  };

  // Support Ticket states
  const [ticketsData, setTicketsData] = useState(null);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Bug Report');
  const [newTicketPriority, setNewTicketPriority] = useState('Low');
  const [newTicketDetail, setNewTicketDetail] = useState('');
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [ticketStaffNotesText, setTicketStaffNotesText] = useState('');
  const [ticketSatisfactionRating, setTicketSatisfactionRating] = useState(5);

  const fetchTicketsData = (userId) => {
    fetch(`${API_BASE}/api/tickets/data/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTicketsData(data);
        }
      })
      .catch(err => console.error('Tickets fetch error:', err));
  };

  // Applications & Recruitment states
  const [applicationsData, setApplicationsData] = useState(null);
  const [activeAppId, setActiveAppId] = useState(null);
  const [newAppType, setNewAppType] = useState('Staff Application');
  const [appAgeInput, setAppAgeInput] = useState('18');
  const [appExperienceInput, setAppExperienceInput] = useState('');
  const [appTimezoneInput, setAppTimezoneInput] = useState('UTC+0');
  const [appSubsInput, setAppSubsInput] = useState('500');
  const [appChannelUrlInput, setAppChannelUrlInput] = useState('');
  const [appDescInput, setAppDescInput] = useState('');
  const [appReviewScore, setAppReviewScore] = useState(5);
  const [appReviewComment, setAppReviewComment] = useState('');
  const [appInterviewTime, setAppInterviewTime] = useState('');

  const fetchApplicationsData = (userId) => {
    fetch(`${API_BASE}/api/applications/data/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setApplicationsData(data);
        }
      })
      .catch(err => console.error('Applications fetch error:', err));
  };

  // Automation & Workflows states
  const [automationData, setAutomationData] = useState(null);
  const [autoRoleInput, setAutoRoleInput] = useState('');
  const [autoThreadChannelInput, setAutoThreadChannelInput] = useState('');
  const [autoThreadNameInput, setAutoThreadNameInput] = useState('');
  const [welcomeBuilderInput, setWelcomeBuilderInput] = useState('');
  const [goodbyeBuilderInput, setGoodbyeBuilderInput] = useState('');
  const [autoArchiveHoursInput, setAutoArchiveHoursInput] = useState(24);
  const [newReactEmoji, setNewReactEmoji] = useState('');
  const [newReactRole, setNewReactRole] = useState('');
  const [newBtnLabel, setNewBtnLabel] = useState('');
  const [newBtnRole, setNewBtnRole] = useState('');
  const [schedMsgTime, setSchedMsgTime] = useState('');
  const [schedMsgChannel, setSchedMsgChannel] = useState('');
  const [schedMsgContent, setSchedMsgContent] = useState('');
  const [reminderTimeInput, setReminderTimeInput] = useState('');
  const [reminderContentInput, setReminderContentInput] = useState('');
  const [workflowNameInput, setWorkflowNameInput] = useState('');
  const [workflowTriggerInput, setWorkflowTriggerInput] = useState('');

  const fetchAutomationData = (userId) => {
    fetch(`${API_BASE}/api/automation/data/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAutomationData(data.automations);
          setWelcomeBuilderInput(data.automations.welcomeMessage || '');
          setGoodbyeBuilderInput(data.automations.goodbyeMessage || '');
          setAutoArchiveHoursInput(data.automations.autoArchiveHours || 24);
        }
      })
      .catch(err => console.error('Automation fetch error:', err));
  };

  // Profile settings customization states
  const [profileData, setProfileData] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('Obsidian Dark');
  const [customBgInput, setCustomBgInput] = useState('');
  const [activeTitleInput, setActiveTitleInput] = useState('Novice Adventurer');
  const [bioInput, setBioInput] = useState('');
  const [favGamesInput, setFavGamesInput] = useState('');
  const [socialDiscordInput, setSocialDiscordInput] = useState('');
  const [socialTwitterInput, setSocialTwitterInput] = useState('');
  const [socialTwitchInput, setSocialTwitchInput] = useState('');
  const [socialYoutubeInput, setSocialYoutubeInput] = useState('');
  const [selectedBadges, setSelectedBadges] = useState([]);

  const fetchProfileData = (userId) => {
    fetch(`${API_BASE}/api/profile/data/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setProfileData(data);
          setSelectedTheme(data.settings.theme || 'Obsidian Dark');
          setCustomBgInput(data.settings.background || '');
          setActiveTitleInput(data.settings.activeTitle || 'Novice Adventurer');
          setBioInput(data.settings.bio || '');
          setFavGamesInput(data.settings.favGames || '');
          setSocialDiscordInput(data.settings.socialDiscord || '');
          setSocialTwitterInput(data.settings.socialTwitter || '');
          setSocialTwitchInput(data.settings.socialTwitch || '');
          setSocialYoutubeInput(data.settings.socialYoutube || '');
          try {
            setSelectedBadges(JSON.parse(data.settings.badges || '[]'));
          } catch (e) {
            setSelectedBadges([]);
          }
        }
      })
      .catch(err => console.error('Profile data fetch error:', err));
  };

  // Premium OS states
  const [premiumOSData, setPremiumOSData] = useState(null);
  const [achNameInput, setAchNameInput] = useState('');
  const [achCriteriaInput, setAchCriteriaInput] = useState('');
  const [achRewardInput, setAchRewardInput] = useState('');
  const [achBadgeInput, setAchBadgeInput] = useState('');
  const [seasonalEventInput, setSeasonalEventInput] = useState('');
  const [quizTitleInput, setQuizTitleInput] = useState('');
  const [quizQuestionInput, setQuizQuestionInput] = useState('');
  const [quizOptionsInput, setQuizOptionsInput] = useState('Option A, Option B, Option C, Option D');
  const [quizCorrectInput, setQuizCorrectInput] = useState('Option A');
  const [quizBadgeInput, setQuizBadgeInput] = useState('');
  const [userSelectedQuizAns, setUserSelectedQuizAns] = useState('');

  const fetchPremiumOSData = (userId) => {
    fetch(`${API_BASE}/api/premium/data/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPremiumOSData(data.config);
          setSeasonalEventInput(data.config.seasonalEvent || '');
        }
      })
      .catch(err => console.error('Premium OS fetch error:', err));
  };

  // Music Studio states
  const [musicState, setMusicState] = useState(null);
  const [musicSearchInput, setMusicSearchInput] = useState('');
  const [musicPlaylistInput, setMusicPlaylistInput] = useState('');
  const [musicSwapIndex1, setMusicSwapIndex1] = useState(0);
  const [musicSwapIndex2, setMusicSwapIndex2] = useState(1);
  const [musicAddTitle, setMusicAddTitle] = useState('');
  const [musicAddArtist, setMusicAddArtist] = useState('');

  const fetchMusicState = (userId) => {
    fetch(`${API_BASE}/api/music/state/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMusicState(data.state);
        }
      })
      .catch(err => console.error('Music state fetch error:', err));
  };

  const fetchDinoPark = (userId) => {
    fetch(`${API_BASE}/api/dino/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setDinoPark(data.park);
      })
      .catch(err => console.error('Dino park fetch error:', err));
  };

  const fetchAquariumData = (userId) => {
    fetch(`${API_BASE}/api/aquarium/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setAquariumData(data.aquarium);
      })
      .catch(err => console.error('Aquarium fetch error:', err));
  };

  const fetchSkillLeaderboard = (skill) => {
    fetch(`${API_BASE}/api/leaderboard?skill=${skill}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSkillLeaderboardList(data.list);
        }
      })
      .catch(err => console.error('Skill leaderboard fetch error:', err));
  };

  const fetchHomesteadData = (userId) => {
    fetch(`${API_BASE}/api/homestead/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data) setHomesteadData(data);
      })
      .catch(err => console.error('Homestead fetch error:', err));
  };

  const fetchFarmAnimals = (userId) => {
    fetch(`${API_BASE}/api/farm-animals/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.farm) {
          setFarmAnimals(data.farm);
        }
      })
      .catch(err => console.error('Farm animals fetch error:', err));
  };

  const handleBuyFarmAnimal = async (type) => {
    try {
      const res = await fetch(`${API_BASE}/api/farm-animals/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, type })
      });
      const data = await res.json();
      if (data.success) {
        setFarmAnimals(data.farm);
        fetchPlayersList();
      } else {
        alert('❌ Purchase failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCollectFarmYield = async () => {
    if (isHarvesting) return;
    setIsHarvesting(true);
    try {
      const res = await fetch(`${API_BASE}/api/farm-animals/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      setIsHarvesting(false);
      if (data.success) {
        setFarmAnimals(data.farm);
        fetchPlayersList();
        alert(`🧺 Successfully harvested animal yields! Added 🍒 ${data.revenueCollected.toLocaleString()} to your wallet.`);
      } else {
        alert('❌ Harvest failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
      setIsHarvesting(false);
    }
  };

  const fetchEnhanceStatus = (userId, baseName) => {
    if (!userId) return;
    fetch(`${API_BASE}/api/enhance/status/${userId}/${encodeURIComponent(baseName)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEnhanceStatus(data);
        }
      })
      .catch(err => console.error('Enhance status fetch error:', err));
  };

  const handleAttemptEnhance = async () => {
    if (enhanceLoading || !loggedInUser) return;
    setEnhanceLoading(true);
    setEnhanceOutcome(null);

    try {
      const res = await fetch(`${API_BASE}/api/enhance/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, baseName: enhanceBaseName })
      });
      const data = await res.json();
      setEnhanceLoading(false);

      if (data.success) {
        setEnhanceOutcome(data);
        fetchEnhanceStatus(loggedInUser, enhanceBaseName);
        fetchPlayersList();
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Enhance attempt failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
      setEnhanceLoading(false);
    }
  };

  const [lotteryData, setLotteryData] = useState({ pool: 1000, lastDraw: Date.now(), myTickets: [] });
  const [wheelDegrees, setWheelDegrees] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lotteryNumbers, setLotteryNumbers] = useState({ n1: '1', n2: '2', n3: '3' });
  const [bjState, setBjState] = useState({ active: false, playerHand: [], dealerHand: [], bet: 0, status: '', playerVal: 0, dealerVal: 0 });
  const [bjWager, setBjWager] = useState(100);

  const fetchLotteryData = (userId) => {
    fetch(`${API_BASE}/api/lottery/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data) setLotteryData(data);
      })
      .catch(err => console.error('Lottery fetch error:', err));
  };

  const fetchMyPlots = (userId) => {
    fetch(`${API_BASE}/api/farm/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMyPlots(data);
      })
      .catch(err => console.error('Farm fetch error:', err));
  };

  const fetchMyInventory = (userId) => {
    fetch(`${API_BASE}/api/inventory/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.inventory) {
          setMyInventory(data.inventory);
          setEquippedWeapon(data.equippedWeapon);
          setEquippedShield(data.equippedShield);
        }
      })
      .catch(err => console.error('Inventory fetch error:', err));
  };

  const fetchShopCatalog = () => {
    fetch(`${API_BASE}/api/shop`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setShopCatalog(data);
      })
      .catch(err => console.error('Shop fetch error:', err));
  };

  const fetchAdminData = (userId) => {
    fetch(`${API_BASE}/api/admin/logs`, {
      headers: { 'Authorization': userId }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAdminLogs(data);
      })
      .catch(err => console.error('Admin logs fetch error:', err));

    fetch(`${API_BASE}/api/admin/settings`, {
      headers: { 'Authorization': userId }
    })
      .then(res => res.json())
      .then(data => {
        if (data) setAdminSettings(data);
      })
      .catch(err => console.error('Admin settings fetch error:', err));
  };

  const fetchMyPortfolio = (userId) => {
    fetch(`${API_BASE}/api/stocks/portfolio/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMyPortfolio(data);
      })
      .catch(err => console.error('Portfolio fetch error:', err));
  };

  const fetchDungeonSession = (userId) => {
    fetch(`${API_BASE}/api/dungeon/session/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.session) {
          setDungeonSession(data.session);
          setCombatActive(true);
          setCombatLog(data.session.log.join('\n'));
        }
      })
      .catch(err => console.error('Dungeon session fetch error:', err));
  };

  // Check URL token on load
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get('token');
    
    fetchShopCatalog();
 
    if (token) {
      window.history.replaceState({}, document.title, window.location.pathname);
      
      fetch(`${API_BASE}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLoggedInUser(data.userId);
          setLoggedInCharName(data.charName);
          setIsAdmin(data.isAdmin || false);
          localStorage.setItem('cherry_userId', data.userId);
          localStorage.setItem('cherry_charName', data.charName);
          localStorage.setItem('cherry_isAdmin', data.isAdmin ? 'true' : 'false');
          fetchMyPlots(data.userId);
          fetchMyInventory(data.userId);
          fetchHomesteadData(data.userId);
          fetchFarmAnimals(data.userId);
          fetchLotteryData(data.userId);
          fetchMyPortfolio(data.userId);
          fetchMyGuild(data.userId);
          fetchMyPet(data.userId);
          fetchMyBusinesses(data.userId);
          fetchDeliveryStatus(data.userId);
          fetchDinoPark(data.userId);
          fetchAquariumData(data.userId);
          fetchSecuritySettings(data.userId);
          fetchCommunityData(data.userId);
          fetchAnalyticsData(data.userId);
          fetchTicketsData(data.userId);
          fetchApplicationsData(data.userId);
          fetchAutomationData(data.userId);
          fetchProfileData(data.userId);
          fetchPremiumOSData(data.userId);
          fetchMusicState(data.userId);
          fetchDungeonSession(data.userId);
          if (data.isAdmin) fetchAdminData(data.userId);
        } else {
          alert('❌ Authentication failed: ' + (data.error || 'Expired token'));
        }
      })
      .catch(err => console.error('Auth error:', err));
    } else {
      const savedUser = localStorage.getItem('cherry_userId');
      const savedChar = localStorage.getItem('cherry_charName');
      const savedAdmin = localStorage.getItem('cherry_isAdmin') === 'true';
      if (savedUser && savedChar) {
        setLoggedInUser(savedUser);
        setLoggedInCharName(savedChar);
        setIsAdmin(savedAdmin);
        fetchMyPlots(savedUser);
        fetchMyInventory(savedUser);
        fetchHomesteadData(savedUser);
        fetchFarmAnimals(savedUser);
        fetchLotteryData(savedUser);
        fetchMyPortfolio(savedUser);
        fetchMyGuild(savedUser);
        fetchMyPet(savedUser);
        fetchMyBusinesses(savedUser);
        fetchDeliveryStatus(savedUser);
        fetchDinoPark(savedUser);
        fetchAquariumData(savedUser);
        fetchSecuritySettings(savedUser);
        fetchCommunityData(savedUser);
        fetchAnalyticsData(savedUser);
        fetchTicketsData(savedUser);
        fetchApplicationsData(savedUser);
        fetchAutomationData(savedUser);
        fetchProfileData(savedUser);
        fetchPremiumOSData(savedUser);
        fetchMusicState(savedUser);
        fetchDungeonSession(savedUser);
        if (savedAdmin) fetchAdminData(savedUser);
      }
    }
  }, []);

  useEffect(() => {
    if (loggedInUser && enhanceBaseName) {
      fetchEnhanceStatus(loggedInUser, enhanceBaseName);
    }
  }, [loggedInUser, enhanceBaseName]);

  // Poll database & server stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await fetch(`${API_BASE}/api/stats`);
        const statsJson = await statsRes.json();
        setStats(statsJson);

        const lbRes = await fetch(`${API_BASE}/api/leaderboard`);
        const lbJson = await lbRes.json();
        setLeaderboard(lbJson);

        const stocksRes = await fetch(`${API_BASE}/api/stocks`);
        const stocksJson = await stocksRes.json();
        setStocksData(stocksJson);
        if (stocksJson.stocks.length > 0 && !selectedStock) {
          setSelectedStock(stocksJson.stocks[0].ticker);
        }

        const playersRes = await fetch(`${API_BASE}/api/players`);
        const playersJson = await playersRes.json();
        setPlayers(playersJson);

        const marketRes = await fetch(`${API_BASE}/api/marketplace`);
        const marketJson = await marketRes.json();
        setListings(marketJson);

        const raidRes = await fetch(`${API_BASE}/api/raid/active`);
        const raidJson = await raidRes.json();
        setActiveRaid(raidJson);

        if (loggedInUser) {
          fetchMyPlots(loggedInUser);
          fetchMyInventory(loggedInUser);
          fetchHomesteadData(loggedInUser);
          fetchLotteryData(loggedInUser);
          fetchMyPortfolio(loggedInUser);
          fetchMyGuild(loggedInUser);
          fetchMyPet(loggedInUser);
          fetchMyBusinesses(loggedInUser);
          fetchDeliveryStatus(loggedInUser);
          fetchDinoPark(loggedInUser);
          fetchAquariumData(loggedInUser);
          fetchSecuritySettings(loggedInUser);
          fetchCommunityData(loggedInUser);
          fetchAnalyticsData(loggedInUser);
          fetchTicketsData(loggedInUser);
          fetchApplicationsData(loggedInUser);
          fetchAutomationData(loggedInUser);
          fetchProfileData(loggedInUser);
          fetchPremiumOSData(loggedInUser);
          fetchMusicState(loggedInUser);
          if (isAdmin) {
            fetchAdminData(loggedInUser);
          }
        }

        if (selectedLeaderboardSkill && selectedLeaderboardSkill !== 'combat') {
          fetchSkillLeaderboard(selectedLeaderboardSkill);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error polling dashboard API:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [selectedStock, loggedInUser, selectedLeaderboardSkill]);

  // Fetch full detailed inventory for logged in user for crafting checkmarks
  useEffect(() => {
    if (loggedInUser) {
      // Find my inventory details in the players catalog
      const me = players.find(p => p.userId === loggedInUser);
      if (me) {
        // Retrieve inventory details
      }
    }
  }, [players, loggedInUser]);

  const activeStockDetails = stocksData.stocks.find(s => s.ticker === selectedStock);
  const chartData = activeStockDetails ? activeStockDetails.history.map((price, idx) => ({
    tick: idx + 1,
    price: price
  })) : [];

  const filteredPlayers = players.filter(p => 
    p.charName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myCharacter = players.find(p => p.userId === loggedInUser);

  // Web Interactive Actions
  const handlePlant = async (plotIndex) => {
    const cropType = selectedSeed[plotIndex] || 'Wheat';
    try {
      const res = await fetch(`${API_BASE}/api/farm/plant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, plotIndex, cropType })
      });
      const data = await res.json();
      if (data.success) {
        setMyPlots(data.plots);
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleWater = async (plotIndex) => {
    try {
      const res = await fetch(`${API_BASE}/api/farm/water`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, plotIndex })
      });
      const data = await res.json();
      if (data.success) {
        setMyPlots(data.plots);
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleHarvest = async (plotIndex) => {
    try {
      const res = await fetch(`${API_BASE}/api/farm/harvest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, plotIndex })
      });
      const data = await res.json();
      if (data.success) {
        setMyPlots(data.plots);
        alert('🧺 Crop harvested successfully! Yields added to bag.');
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCollectRent = async (propertyId) => {
    try {
      const res = await fetch(`${API_BASE}/api/homestead/collect-rent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, propertyId })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🍒 Successfully collected rent! Earned ${data.rentEarned} cherries.`);
        fetchHomesteadData(loggedInUser);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCollectAquarium = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/homestead/collect-aquarium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🍒 Successfully collected aquarium revenue! Earned ${data.revenue} cherries.`);
        fetchHomesteadData(loggedInUser);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloneDino = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/homestead/clone-dino`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🦖 Dinosaur successfully cloned! Check out your updated park.`);
        fetchHomesteadData(loggedInUser);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCollectDino = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/homestead/collect-dino`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🍒 Successfully collected dinosaur park visitor fees! Earned ${data.revenue} cherries.`);
        fetchHomesteadData(loggedInUser);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpinWheel = async () => {
    if (isSpinning) return;
    try {
      const res = await fetch(`${API_BASE}/api/wheel/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        setIsSpinning(true);
        const labelToIndex = {
          'CHERRY 🍒': 0,
          'CHERRY BASKET 🍒': 1,
          'XP BOOST ⚡': 2,
          'LUCK BUFF 🍀': 3,
          'LEMON 🍋': 4,
          'RUIN 💀': 5,
          'NOTHING ❌': 6,
          'BONUS CHERRY 🍒': 7
        };
        const idx = labelToIndex[data.landed] ?? 0;
        const currentRotation = wheelDegrees;
        const baseSpin = 360 * 5;
        const targetWedgeOffset = 360 - ((idx * 45) + 22.5);
        const newRotation = Math.ceil(currentRotation / 360) * 360 + baseSpin + targetWedgeOffset;
        
        setWheelDegrees(newRotation);
        
        setTimeout(() => {
          setIsSpinning(false);
          setSpinResult(data.landed);
        }, 4000);
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
      setIsSpinning(false);
    }
  };

  const handleBuyLotteryTicket = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/lottery/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, n1: lotteryNumbers.n1, n2: lotteryNumbers.n2, n3: lotteryNumbers.n3 })
      });
      const data = await res.json();
      if (data.success) {
        alert('🎟️ Ticket successfully purchased! May lady luck smile upon you.');
        setLotteryData(prev => ({ ...prev, myTickets: data.myTickets }));
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBlackjackStart = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/blackjack/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, wager: bjWager })
      });
      const data = await res.json();
      if (data.success) {
        setBjState({
          active: data.status === 'playing',
          playerHand: data.playerHand,
          dealerHand: data.dealerHand,
          bet: data.bet,
          status: data.status,
          playerVal: data.playerVal,
          dealerVal: data.dealerVal
        });
        if (data.status === 'natural_blackjack') {
          alert(`🎉 Natural Blackjack! You won 🍒 ${Math.floor(data.bet * 2.5)} cherries!`);
        }
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBlackjackHit = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/blackjack/hit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        setBjState(prev => ({
          ...prev,
          playerHand: data.playerHand,
          playerVal: data.playerVal,
          status: data.status,
          active: data.status === 'playing'
        }));
        if (data.status === 'bust') {
          alert(`💥 Bust! You went over 21. Dealer wins.`);
        }
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBlackjackStand = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/blackjack/stand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        setBjState({
          active: false,
          playerHand: data.playerHand,
          dealerHand: data.dealerHand,
          bet: bjState.bet,
          status: data.status,
          playerVal: data.playerVal,
          dealerVal: data.dealerVal
        });

        if (data.status === 'win') {
          alert(`🎉 You win! Double payout: 🍒 ${data.payout}`);
        } else if (data.status === 'dealer_bust') {
          alert(`🦖 Dealer busted! You won 🍒 ${data.payout}`);
        } else if (data.status === 'loss') {
          alert(`😢 Dealer wins. Better luck next time!`);
        } else if (data.status === 'push') {
          alert(`🤝 Push! Your bet of 🍒 ${data.payout} has been returned.`);
        }
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBlackjackDouble = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/blackjack/double`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        setBjState({
          active: false,
          playerHand: data.playerHand,
          dealerHand: data.dealerHand || [],
          bet: bjState.bet * 2,
          status: data.status,
          playerVal: data.playerVal,
          dealerVal: data.dealerVal || 0
        });

        if (data.status === 'bust') {
          alert(`💥 Bust on Double Down! You lost 🍒 ${bjState.bet * 2} cherries.`);
        } else if (data.status === 'win') {
          alert(`🎉 Double Down Win! You won 🍒 ${data.payout}!`);
        } else if (data.status === 'dealer_bust') {
          alert(`🦖 Dealer busted! You won 🍒 ${data.payout}!`);
        } else if (data.status === 'loss') {
          alert(`😢 Dealer wins. Lost 🍒 ${bjState.bet * 2} cherries.`);
        } else if (data.status === 'push') {
          alert(`🤝 Push! Your bet of 🍒 ${data.payout} has been returned.`);
        }
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBuyListing = async (listingId) => {
    try {
      const res = await fetch(`${API_BASE}/api/marketplace/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, listingId })
      });
      const data = await res.json();
      if (data.success) {
        alert('🛍️ Item purchased successfully! Returned to bag.');
        // Refresh listings
        const marketRes = await fetch(`${API_BASE}/api/marketplace`);
        const marketJson = await marketRes.json();
        setListings(marketJson);
      } else {
        alert('❌ Purchase failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCraftItem = async (recipeId) => {
    try {
      const res = await fetch(`${API_BASE}/api/craft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, recipeId })
      });
      const data = await res.json();
      if (data.success) {
        alert('🔨 Item crafted successfully! Check your inventory grid.');
      } else {
        alert('❌ Crafting failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCookItem = async (recipeId, heatLevel) => {
    try {
      const res = await fetch(`${API_BASE}/api/cook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, recipeId, heatLevel })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🍳 Dish cooked successfully! Your Cooking level is now Lvl ${data.newLvl}.`);
      } else if (data.burnt) {
        alert('💥 Cooking disaster: ' + data.error);
      } else {
        alert('❌ Cooking failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEquipItem = async (itemName, slot) => {
    try {
      const res = await fetch(`${API_BASE}/api/character/equip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, itemName, slot })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🛡️ Successfully equipped ${itemName} to your ${slot}!`);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Equipping failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBuyShopItem = async (itemId) => {
    try {
      const res = await fetch(`${API_BASE}/api/shop/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, itemId })
      });
      const data = await res.json();
      if (data.success) {
        alert('🛍️ Item purchased successfully! Added to bag.');
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Purchase failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAdminSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': loggedInUser
        },
        body: JSON.stringify({
          welcomeMsg: adminSettings.welcomeMsg,
          leaveMsg: adminSettings.leaveMsg,
          autoRole: adminSettings.autoRole
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('⚙️ Welcome notice settings updated successfully!');
      } else {
        alert('❌ Failed to update settings: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleModifyBalance = async (e) => {
    e.preventDefault();
    if (!adminTargetUser || adminAmount <= 0) {
      alert('❌ Please enter a valid Target User ID and Amount.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/modify-balance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': loggedInUser
        },
        body: JSON.stringify({
          targetUserId: adminTargetUser,
          action: adminAction,
          amount: parseInt(adminAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`👑 Success! Adjusted player balance. New balance: 🍒 ${data.newBalance.toLocaleString()}`);
        setAdminTargetUser('');
      } else {
        alert('❌ Failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBuyStock = async (ticker) => {
    if (!stockSharesInput || parseInt(stockSharesInput) <= 0) {
      alert('❌ Please enter a valid number of shares.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/stocks/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, ticker, shares: parseInt(stockSharesInput) })
      });
      const data = await res.json();
      if (data.success) {
        alert(`📈 Successfully purchased ${stockSharesInput} shares of ${ticker}!`);
        setStockSharesInput('');
        fetchMyPortfolio(loggedInUser);
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSellStock = async (ticker) => {
    if (!stockSharesInput || parseInt(stockSharesInput) <= 0) {
      alert('❌ Please enter a valid number of shares.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/stocks/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, ticker, shares: parseInt(stockSharesInput) })
      });
      const data = await res.json();
      if (data.success) {
        alert(`💰 Successfully sold ${stockSharesInput} shares of ${ticker}!`);
        setStockSharesInput('');
        fetchMyPortfolio(loggedInUser);
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPlayersList = () => {
    fetch(`${API_BASE}/api/players`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPlayers(data);
      })
      .catch(err => console.error('Players fetch error:', err));
  };

  const handleStartDungeon = async () => {
    if (isCombatLoading) return;
    setCombatLog('');
    setCombatResult(null);
    setDungeonSession(null);
    setIsCombatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/dungeon/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, dungeonId: selectedDungeon })
      });
      const data = await res.json();
      setIsCombatLoading(false);

      if (data.success) {
        setDungeonSession(data.session);
        setCombatActive(true);
        setCombatLog(data.session.log.join('\n'));
      } else {
        alert('❌ Dungeon start failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
      setIsCombatLoading(false);
    }
  };

  const handleDungeonTurn = async (action) => {
    if (isCombatLoading || !dungeonSession) return;
    setIsCombatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/dungeon/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, action })
      });
      const data = await res.json();
      setIsCombatLoading(false);

      if (data.success) {
        setDungeonSession(data.session);
        setCombatLog(data.session.log.join('\n'));
        if (data.finished) {
          setCombatResult(data);
          fetchPlayersList();
          fetchMyInventory(loggedInUser);
        }
      } else {
        alert('❌ Action failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
      setIsCombatLoading(false);
    }
  };

  const handleHeal = async (potionType) => {
    try {
      const res = await fetch(`${API_BASE}/api/character/heal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, potionType })
      });
      const data = await res.json();
      if (data.success) {
        alert(`💖 Drank Potion! Restored stats.`);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Healing failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateMarketListing = async (e) => {
    e.preventDefault();
    if (!listMarketItem || listMarketQty <= 0 || listMarketPrice <= 0) {
      alert('❌ Please select an item, positive quantity and positive price.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/marketplace/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, itemName: listMarketItem, quantity: parseInt(listMarketQty), price: parseInt(listMarketPrice) })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🛍️ Successfully listed ${listMarketQty}x ${listMarketItem} for ${listMarketPrice} cherries!`);
        setListMarketItem('');
        setListMarketQty(1);
        setListMarketPrice(100);
        const marketRes = await fetch(`${API_BASE}/api/marketplace`);
        const marketJson = await marketRes.json();
        setListings(marketJson);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Listing failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpawnItem = async (e) => {
    e.preventDefault();
    if (!adminTargetUser || !adminSpawnItem || adminSpawnQty <= 0) {
      alert('❌ Please enter a target user ID, select an item and a positive quantity.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/spawn-item`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': loggedInUser
        },
        body: JSON.stringify({ targetUserId: adminTargetUser, itemName: adminSpawnItem, quantity: parseInt(adminSpawnQty) })
      });
      const data = await res.json();
      if (data.success) {
        alert(`👑 Spawned ${adminSpawnQty}x ${adminSpawnItem} for user ${adminTargetUser}!`);
        setAdminSpawnQty(5);
        fetchAdminData(loggedInUser);
      } else {
        alert('❌ Spawner failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePublishAnnouncement = async (e) => {
    e.preventDefault();
    if (!adminNoticeTitle || !adminNoticeContent) {
      alert('❌ Announcement requires a title and content.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/set-announcement`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': loggedInUser
        },
        body: JSON.stringify({ title: adminNoticeTitle, content: adminNoticeContent })
      });
      const data = await res.json();
      if (data.success) {
        alert('📢 Guild Notice board announcement updated!');
        setAdminNoticeTitle('');
        setAdminNoticeContent('');
      } else {
        alert('❌ Update failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDepositGuildCoins = async (e) => {
    e.preventDefault();
    if (!guildDepositInput || parseInt(guildDepositInput) <= 0) {
      alert('❌ Please enter a valid positive number of cherries.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/guild/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, amount: parseInt(guildDepositInput) })
      });
      const data = await res.json();
      if (data.success) {
        alert(`💰 Successfully deposited 🍒 ${parseInt(guildDepositInput).toLocaleString()} cherries into guild treasury!`);
        setGuildDepositInput('');
        fetchMyGuild(loggedInUser);
        // Deduct from local character coins display
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Deposit failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpgradeGuildPerk = async (perkType) => {
    try {
      const res = await fetch(`${API_BASE}/api/guild/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, perkType })
      });
      const data = await res.json();
      if (data.success) {
        alert(`👑 Upgrade Success! Perk level upgraded to Lvl ${data.newLevel}!`);
        fetchMyGuild(loggedInUser);
      } else {
        alert('❌ Upgrade failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRaidAction = async (action) => {
    try {
      const res = await fetch(`${API_BASE}/api/raid/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, action })
      });
      const data = await res.json();
      if (data.success) {
        if (data.activeRaid) {
          setActiveRaid(data.activeRaid);
        }
      } else {
        alert('❌ Action failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Tycoon Action Handlers: Pets
  const handleAdoptPet = async (e) => {
    e.preventDefault();
    if (!adoptPetName) {
      alert('❌ Please enter a name for your pet.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/pet/adopt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, petType: adoptPetType, petName: adoptPetName })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🎉 You adopted ${adoptPetName} the ${adoptPetType}!`);
        setAdoptPetName('');
        fetchMyPet(loggedInUser);
      } else {
        alert('❌ Adoption failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFeedPet = async (itemName) => {
    try {
      const res = await fetch(`${API_BASE}/api/pet/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, itemName })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🍎 Yum! Fed ${itemName} to your pet. XP gained!`);
        fetchMyPet(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Feed failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlayPet = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pet/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        alert('🎾 Played with pet. Affection increased! (Spent 15 MP)');
        fetchMyPet(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Play failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTrainPet = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pet/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        alert('⚔️ Pet finished training! +50 XP (Spent 150 cherries)');
        fetchMyPet(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Training failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartPetAdventure = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pet/adventure/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        setPetAdventureResult(null);
        alert(`🌲 Companion dispatched on forest expedition! Check back in 1 minute.`);
        fetchMyPet(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Adventure dispatch failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClaimPetAdventure = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pet/adventure/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        setPetAdventureResult(data);
        fetchMyPet(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Failed to claim adventure: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Tycoon Action Handlers: Businesses
  const handleBuyBusiness = async (businessType) => {
    try {
      const res = await fetch(`${API_BASE}/api/business/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, businessType })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🏢 Successfully acquired ${businessType} business!`);
        fetchMyBusinesses(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Acquisition failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpgradeBusiness = async (businessType) => {
    try {
      const res = await fetch(`${API_BASE}/api/business/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, businessType })
      });
      const data = await res.json();
      if (data.success) {
        alert(`👑 Upgraded ${businessType} level! Revenue rate doubled.`);
        fetchMyBusinesses(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Upgrade failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCollectBusinessRevenue = async (businessType) => {
    try {
      const res = await fetch(`${API_BASE}/api/business/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, businessType })
      });
      const data = await res.json();
      if (data.success) {
        alert(`💰 Collected 🍒 ${data.revenueCollected.toLocaleString()} cherries from your ${businessType}!`);
        fetchMyBusinesses(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Collection failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Tycoon Action Handlers: Delivery Logistics
  const handleUpgradeVehicle = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/delivery/upgrade-vehicle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🚚 Transport upgraded to ${data.vehicle}!`);
        fetchDeliveryStatus(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Upgrade failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleHireWorker = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/delivery/hire-worker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        alert('👥 Worker hired! Passive earnings speed increased.');
        fetchDeliveryStatus(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Hiring failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCollectPassiveEarnings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/delivery/collect-passive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        alert(`💰 Collected 🍒 ${data.rewardClaimed.toLocaleString()} cherries from automated passives!`);
        fetchDeliveryStatus(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Collection failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartDeliveryJob = async (jobName) => {
    try {
      const res = await fetch(`${API_BASE}/api/delivery/start-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, jobName })
      });
      const data = await res.json();
      if (data.success) {
        alert(`📦 Dispatched cargo job '${jobName}'!`);
        fetchDeliveryStatus(loggedInUser);
      } else {
        alert('❌ Dispatch failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClaimDeliveryJob = async (jobId) => {
    try {
      const res = await fetch(`${API_BASE}/api/delivery/claim-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, jobId })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🏆 Cargo delivered! Earned 🍒 ${data.payout.toLocaleString()} cherries.`);
        fetchDeliveryStatus(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Payout failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Tycoon Actions: Dino Park
  const handleCloneDinosaur = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dino/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        alert('🦖 Prehistoric egg hatched! You cloned a new dinosaur.');
        fetchDinoPark(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Cloning failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpgradeSecurity = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dino/upgrade-security`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        alert('🛡️ Security systems grid upgraded successfully!');
        fetchDinoPark(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Upgrade failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCollectDinoRevenue = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dino/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        alert(`💰 Collected 🍒 ${data.revenueCollected.toLocaleString()} cherries from dinosaur zoo visitors!`);
        fetchDinoPark(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Collection failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Tycoon Actions: Aquarium Museum
  const handleBuyFish = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/aquarium/buy-fish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        alert('🐠 Added a new rare species to your exhibition tank!');
        fetchAquariumData(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Stocking failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCollectAquariumRevenue = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/aquarium/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        alert(`💰 Collected 🍒 ${data.revenueCollected.toLocaleString()} cherries in visitor ticket fees!`);
        fetchAquariumData(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Collection failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Casino Actions: Slots
  const handleSlotsSpin = async () => {
    const bet = parseInt(slotsBetInput);
    if (isNaN(bet) || bet <= 0) {
      alert('❌ Enter a valid bet amount.');
      return;
    }
    setSlotsSpinning(true);
    setSlotsResult(null);

    const reelsTimer = setInterval(() => {
      const symbols = ['🍒', '💎', '🍋', '🔔', '🍀', '⭐'];
      setSlotsSymbols([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ]);
    }, 100);

    try {
      const res = await fetch(`${API_BASE}/api/slots/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, bet })
      });
      const data = await res.json();
      
      setTimeout(() => {
        clearInterval(reelsTimer);
        setSlotsSpinning(false);
        if (data.success) {
          setSlotsSymbols(data.reels);
          setSlotsResult(data);
          setSlotsJackpotVal(data.newJackpot);
          fetchMyInventory(loggedInUser);
        } else {
          alert('❌ Spin failed: ' + data.error);
        }
      }, 1000);

    } catch (e) {
      clearInterval(reelsTimer);
      setSlotsSpinning(false);
      console.error(e);
    }
  };

  // Casino Actions: Blackjack
  const handleBjStart = async () => {
    const bet = parseInt(bjBetInput);
    if (isNaN(bet) || bet <= 0) {
      alert('❌ Enter a valid bet amount.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/blackjack/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, bet })
      });
      const data = await res.json();
      if (data.success) {
        setBjGameState(data);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Bet failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBjHit = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/blackjack/hit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        setBjGameState(data);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Hit failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBjStand = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/blackjack/stand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        setBjGameState(data);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Stand failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBjDouble = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/blackjack/double`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        setBjGameState(data);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Double failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // AI Hub Actions
  const handleAiChatSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!aiChatInput.trim()) return;

    const userMsg = { sender: 'user', text: aiChatInput };
    setAiChatMessages(prev => [...prev, userMsg]);
    const promptText = aiChatInput;
    setAiChatInput('');

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: promptText, mode: aiChatMode })
      });
      const data = await res.json();
      if (data.success) {
        setAiChatMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setAiChatMessages(prev => [...prev, { sender: 'ai', text: '❌ Error processing AI request: ' + data.error }]);
      }
    } catch (err) {
      console.error(err);
      setAiChatMessages(prev => [...prev, { sender: 'ai', text: '❌ Network connection error.' }]);
    }
  };

  const handleAiModerateSubmit = async () => {
    if (!aiModText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/ai/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: aiModText })
      });
      const data = await res.json();
      if (data.success) {
        setAiModResult(data);
      } else {
        alert('❌ Moderation failed: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiSummarizeSubmit = async () => {
    if (!aiSumText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/ai/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiSumText, type: aiSumType })
      });
      const data = await res.json();
      if (data.success) {
        setAiSumResult(data.summary);
      } else {
        alert('❌ Summarize failed: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiTranslateSubmit = async () => {
    if (!aiTransText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/ai/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiTransText, targetLang: aiTransLang })
      });
      const data = await res.json();
      if (data.success) {
        setAiTransResult(data);
      } else {
        alert('❌ Translation failed: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiStarterSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ai/starter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: aiStarterCategory })
      });
      const data = await res.json();
      if (data.success) {
        setAiStarterResult(data.starters);
      } else {
        alert('❌ Starters generation failed: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Server Security Actions
  const handleSecurityToggle = async (key) => {
    try {
      const res = await fetch(`${API_BASE}/api/security/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      const data = await res.json();
      if (data.success) {
        setSecuritySettings(data.settings);
      } else {
        alert('❌ Toggle failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePunishSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!punishUserId.trim() || !punishDuration.trim()) {
      alert('❌ Enter target user and duration.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/security/punish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: punishUserId,
          type: punishType,
          durationMin: punishDuration,
          reason: punishReason
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🚨 Issued temporary ${punishType.toUpperCase()} successfully!`);
        setPunishUserId('');
        setPunishReason('');
        fetchSecuritySettings(loggedInUser);
      } else {
        alert('❌ Punishment failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePayBail = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/security/jail/bail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        alert('🔓 Posted bail! You have been released from Jail.');
        fetchSecuritySettings(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Bail failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Community Actions
  const handleCommendRep = async (targetUserId) => {
    try {
      const res = await fetch(`${API_BASE}/api/community/rep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✨ Commended User! Their Reputation is now ${data.newRep}.`);
        fetchCommunityData(loggedInUser);
      } else {
        alert('❌ Commend failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnswerDaily = async (e) => {
    if (e) e.preventDefault();
    if (!dailyAnswerInput.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/community/daily-question/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: loggedInCharName, text: dailyAnswerInput })
      });
      const data = await res.json();
      if (data.success) {
        setDailyAnswerInput('');
        fetchCommunityData(loggedInUser);
      } else {
        alert('❌ Submit failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePoll = async (e) => {
    if (e) e.preventDefault();
    if (!newPollQuestion.trim() || !newPollOptA.trim() || !newPollOptB.trim()) {
      alert('❌ Enter question and options.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/community/poll/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newPollQuestion, optionA: newPollOptA, optionB: newPollOptB })
      });
      const data = await res.json();
      if (data.success) {
        setNewPollQuestion('');
        setNewPollOptA('');
        setNewPollOptB('');
        fetchCommunityData(loggedInUser);
      } else {
        alert('❌ Create poll failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVotePoll = async (pollId, option) => {
    try {
      const res = await fetch(`${API_BASE}/api/community/poll/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, option })
      });
      const data = await res.json();
      if (data.success) {
        fetchCommunityData(loggedInUser);
      } else {
        alert('❌ Vote failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostConfess = async (e) => {
    if (e) e.preventDefault();
    if (!confessInput.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/community/confess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: confessInput })
      });
      const data = await res.json();
      if (data.success) {
        setConfessInput('');
        fetchCommunityData(loggedInUser);
      } else {
        alert('❌ Post confession failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStarboardAdd = async (author, content) => {
    try {
      const res = await fetch(`${API_BASE}/api/community/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, content })
      });
      const data = await res.json();
      if (data.success) {
        alert('⭐ Pushed message onto Starboard highlight shelf!');
        fetchCommunityData(loggedInUser);
      } else {
        alert('❌ Star failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleWishBirthday = async (targetUserId) => {
    try {
      const res = await fetch(`${API_BASE}/api/community/birthday/wish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });
      const data = await res.json();
      if (data.success) {
        alert('🎉 Wish sent! Player was awarded +10 cherries!');
        fetchCommunityData(loggedInUser);
      } else {
        alert('❌ Wish failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEventRegister = async (eventId) => {
    try {
      const res = await fetch(`${API_BASE}/api/community/event/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, userName: loggedInCharName })
      });
      const data = await res.json();
      if (data.success) {
        alert('📅 Registered for the community event!');
        fetchCommunityData(loggedInUser);
      } else {
        alert('❌ Registration failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleContributeGoal = async (e) => {
    if (e) e.preventDefault();
    if (!goalContribAmount.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/community/goal/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser, amount: goalContribAmount })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🏰 Contributed 🍒 ${goalContribAmount} cherries to community goal!`);
        fetchCommunityData(loggedInUser);
        fetchMyInventory(loggedInUser);
      } else {
        alert('❌ Contribution failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTicket = async (e) => {
    if (e) e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketDetail.trim()) {
      alert('⚠️ Subject and details are required to submit a ticket.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/tickets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser,
          author: loggedInCharName,
          category: newTicketCategory,
          priority: newTicketPriority,
          subject: newTicketSubject,
          text: newTicketDetail
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('🎟️ Ticket submitted and assigned to support staff!');
        setNewTicketSubject('');
        setNewTicketDetail('');
        fetchTicketsData(loggedInUser);
      } else {
        alert('❌ Submission failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTicketReply = async (e) => {
    if (e) e.preventDefault();
    if (!ticketReplyText.trim() || !activeTicketId) return;

    try {
      const res = await fetch(`${API_BASE}/api/tickets/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: activeTicketId,
          author: loggedInCharName,
          text: ticketReplyText
        })
      });
      const data = await res.json();
      if (data.success) {
        setTicketReplyText('');
        fetchTicketsData(loggedInUser);
      } else {
        alert('❌ Reply failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStaffNotes = async () => {
    if (!activeTicketId) return;
    try {
      const res = await fetch(`${API_BASE}/api/tickets/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: activeTicketId,
          staffNotes: ticketStaffNotesText
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('📝 Staff private notes updated!');
        fetchTicketsData(loggedInUser);
      } else {
        alert('❌ Update failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEscalateTicket = async () => {
    if (!activeTicketId) return;
    try {
      const res = await fetch(`${API_BASE}/api/tickets/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: activeTicketId })
      });
      const data = await res.json();
      if (data.success) {
        alert('⚡ Ticket priority escalated to EMERGENCY and assigned to Admin!');
        fetchTicketsData(loggedInUser);
      } else {
        alert('❌ Escalation failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseTicket = async () => {
    if (!activeTicketId) return;
    try {
      const res = await fetch(`${API_BASE}/api/tickets/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: activeTicketId,
          satisfaction: ticketSatisfactionRating
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('🎟️ Ticket closed successfully. Rating saved.');
        fetchTicketsData(loggedInUser);
      } else {
        alert('❌ Close failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateApplication = async (e) => {
    if (e) e.preventDefault();
    
    let details = {};
    if (newAppType === 'Staff Application') {
      details = { age: appAgeInput, experience: appExperienceInput, timezone: appTimezoneInput };
      if (!appExperienceInput.trim()) {
        alert('⚠️ Experience details are required for Staff applications!');
        return;
      }
    } else if (newAppType === 'Creator Application') {
      details = { subscribers: appSubsInput, channelUrl: appChannelUrlInput, description: appDescInput };
      if (!appChannelUrlInput.trim()) {
        alert('⚠️ Channel URL is required for Creator applications!');
        return;
      }
    } else if (newAppType === 'Whitelist Application') {
      details = { age: appAgeInput, agreeRules: 'Yes', description: appDescInput };
    } else {
      details = { description: appDescInput };
      if (!appDescInput.trim()) {
        alert('⚠️ Description / Appeal details are required!');
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/api/applications/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser,
          author: loggedInCharName,
          type: newAppType,
          details
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.application.autoAccepted) {
          alert('🎉 Application submitted and AUTO-APPROVED based on recruitment rules!');
        } else {
          alert('📝 Application submitted and added to recruitment queue.');
        }
        setAppExperienceInput('');
        setAppChannelUrlInput('');
        setAppDescInput('');
        fetchApplicationsData(loggedInUser);
      } else {
        alert('❌ Submission failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostAppReview = async (e) => {
    if (e) e.preventDefault();
    if (!activeAppId || !appReviewComment.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/applications/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: activeAppId,
          reviewer: loggedInCharName,
          score: appReviewScore,
          comment: appReviewComment
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('✍️ Peer team review added!');
        setAppReviewComment('');
        fetchApplicationsData(loggedInUser);
      } else {
        alert('❌ Review failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleScheduleAppInterview = async (e) => {
    if (e) e.preventDefault();
    if (!activeAppId || !appInterviewTime) return;

    try {
      const res = await fetch(`${API_BASE}/api/applications/schedule-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: activeAppId,
          interviewTime: appInterviewTime
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('📅 Interview schedule set and notification logs sent!');
        fetchApplicationsData(loggedInUser);
      } else {
        alert('❌ Schedule failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateAppWorkflow = async (status) => {
    if (!activeAppId) return;

    try {
      const res = await fetch(`${API_BASE}/api/applications/workflow-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: activeAppId,
          status
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`⚙️ Application status updated to ${status}!`);
        fetchApplicationsData(loggedInUser);
      } else {
        alert('❌ Workflow update failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateGeneralAutomations = async (e) => {
    if (e) e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/api/automation/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          welcomeMessage: welcomeBuilderInput,
          goodbyeMessage: goodbyeBuilderInput,
          autoArchiveHours: autoArchiveHoursInput
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('⚙️ General server welcome & archive automations updated!');
        fetchAutomationData(loggedInUser);
      } else {
        alert('❌ Update failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAutoRole = async (e) => {
    if (e) e.preventDefault();
    if (!autoRoleInput.trim() || !automationData) return;

    try {
      const updatedRoles = [...(automationData.autoRoles || []), autoRoleInput];
      const res = await fetch(`${API_BASE}/api/automation/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRoles: updatedRoles })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🏷️ Added "${autoRoleInput}" to Auto Roles list!`);
        setAutoRoleInput('');
        fetchAutomationData(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveAutoRole = async (roleName) => {
    if (!automationData) return;
    try {
      const updatedRoles = (automationData.autoRoles || []).filter(r => r !== roleName);
      const res = await fetch(`${API_BASE}/api/automation/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRoles: updatedRoles })
      });
      const data = await res.json();
      if (data.success) {
        fetchAutomationData(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAutoThread = async (e) => {
    if (e) e.preventDefault();
    if (!autoThreadChannelInput.trim() || !autoThreadNameInput.trim() || !automationData) return;

    try {
      const updatedThreads = [...(automationData.autoThreads || []), {
        triggerChannel: autoThreadChannelInput,
        threadName: autoThreadNameInput
      }];
      const res = await fetch(`${API_BASE}/api/automation/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoThreads: updatedThreads })
      });
      const data = await res.json();
      if (data.success) {
        alert('⛓️ Auto-Thread trigger rule registered!');
        setAutoThreadChannelInput('');
        setAutoThreadNameInput('');
        fetchAutomationData(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddReactionRole = async (e) => {
    if (e) e.preventDefault();
    if (!newReactEmoji.trim() || !newReactRole.trim() || !automationData) return;

    try {
      const updatedReactionRoles = [...(automationData.reactionRoles || []), {
        emoji: newReactEmoji,
        role: newReactRole
      }];
      const res = await fetch(`${API_BASE}/api/automation/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionRoles: updatedReactionRoles })
      });
      const data = await res.json();
      if (data.success) {
        alert('🎭 Reaction Role binding registered!');
        setNewReactEmoji('');
        setNewReactRole('');
        fetchAutomationData(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddButtonRole = async (e) => {
    if (e) e.preventDefault();
    if (!newBtnLabel.trim() || !newBtnRole.trim() || !automationData) return;

    try {
      const updatedButtonRoles = [...(automationData.buttonRoles || []), {
        label: newBtnLabel,
        role: newBtnRole
      }];
      const res = await fetch(`${API_BASE}/api/automation/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buttonRoles: updatedButtonRoles })
      });
      const data = await res.json();
      if (data.success) {
        alert('🔘 Button Role trigger configured!');
        setNewBtnLabel('');
        setNewBtnRole('');
        fetchAutomationData(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSchedMsg = async (e) => {
    if (e) e.preventDefault();
    if (!schedMsgTime.trim() || !schedMsgChannel.trim() || !schedMsgContent.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/automation/scheduled/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time: schedMsgTime,
          channel: schedMsgChannel,
          content: schedMsgContent
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('📢 Scheduled Message registered on active server intervals!');
        setSchedMsgTime('');
        setSchedMsgChannel('');
        setSchedMsgContent('');
        fetchAutomationData(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSchedMsg = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/automation/scheduled/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        fetchAutomationData(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateReminder = async (e) => {
    if (e) e.preventDefault();
    if (!reminderTimeInput.trim() || !reminderContentInput.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/automation/reminder/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time: reminderTimeInput,
          content: reminderContentInput
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('⏰ One-off reminder scheduler set!');
        setReminderTimeInput('');
        setReminderContentInput('');
        fetchAutomationData(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateWorkflow = async (e) => {
    if (e) e.preventDefault();
    if (!workflowNameInput.trim() || !workflowTriggerInput.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/automation/workflow/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workflowNameInput,
          triggers: workflowTriggerInput
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('⛓️ Custom automation workflow registered successfully!');
        setWorkflowNameInput('');
        setWorkflowTriggerInput('');
        fetchAutomationData(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfileCustomizations = async (e) => {
    if (e) e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/api/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser,
          theme: selectedTheme,
          background: customBgInput,
          activeTitle: activeTitleInput,
          bio: bioInput,
          favGames: favGamesInput,
          socialDiscord: socialDiscordInput,
          socialTwitter: socialTwitterInput,
          socialTwitch: socialTwitchInput,
          socialYoutube: socialYoutubeInput,
          badges: selectedBadges
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('🎨 Profile customizations updated successfully!');
        fetchProfileData(loggedInUser);
      } else {
        alert('❌ Update failed: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleBadgeSelection = (badge) => {
    if (selectedBadges.includes(badge)) {
      setSelectedBadges(prev => prev.filter(b => b !== badge));
    } else {
      setSelectedBadges(prev => [...prev, badge]);
    }
  };

  const handleToggleOSPlugin = async (plugin) => {
    try {
      const res = await fetch(`${API_BASE}/api/premium/plugins/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plugin })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🧩 Modular plugin "${plugin}" installation updated!`);
        fetchPremiumOSData(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateOSAchievement = async (e) => {
    if (e) e.preventDefault();
    if (!achNameInput.trim() || !achCriteriaInput.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/premium/achievements/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: achNameInput,
          criteria: achCriteriaInput,
          reward: achRewardInput,
          badge: achBadgeInput
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('🏅 Custom Dynamic Achievement registered on active server configurations!');
        setAchNameInput('');
        setAchCriteriaInput('');
        setAchRewardInput('');
        setAchBadgeInput('');
        fetchPremiumOSData(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetOSSeasonalEvent = async (e) => {
    if (e) e.preventDefault();
    if (!seasonalEventInput.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/premium/event/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: seasonalEventInput })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🎉 Active seasonal holiday theme updated to: ${seasonalEventInput}!`);
        fetchPremiumOSData(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateOSQuiz = async (e) => {
    if (e) e.preventDefault();
    if (!quizTitleInput.trim() || !quizQuestionInput.trim() || !quizCorrectInput.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/premium/quiz/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quizTitleInput,
          question: quizQuestionInput,
          options: quizOptionsInput.split(',').map(o => o.trim()),
          correct: quizCorrectInput,
          certificateBadge: quizBadgeInput
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('🎓 Learning Course & Certification Quiz added!');
        setQuizTitleInput('');
        setQuizQuestionInput('');
        setQuizOptionsInput('Option A, Option B, Option C, Option D');
        setQuizCorrectInput('Option A');
        setQuizBadgeInput('');
        fetchPremiumOSData(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTakeOSQuiz = (quiz, answer) => {
    if (answer === quiz.questions[0].correct) {
      alert(`🎉 Congratulations! You passed the quiz and earned the "${quiz.certificateBadge}" badge certification!`);
      setSelectedBadges(prev => {
        const next = [...prev];
        if (!next.includes(quiz.certificateBadge)) {
          next.push(quiz.certificateBadge);
        }
        return next;
      });
    } else {
      alert(`❌ Incorrect! The correct answer was "${quiz.questions[0].correct}". Study rules and try again.`);
    }
  };

  const handleTriggerOSBackup = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/premium/backup/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        alert('💾 Database tables backup complete. Restore points generated!');
        fetchPremiumOSData(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateOSDevToken = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/premium/devapi/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        alert('🔑 Generated a new public developer API token!');
        fetchPremiumOSData(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMusicControl = async (action, value) => {
    try {
      const res = await fetch(`${API_BASE}/api/music/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value })
      });
      const data = await res.json();
      if (data.success) {
        fetchMusicState(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMusicQueueEdit = async (action, payload = {}) => {
    try {
      const res = await fetch(`${API_BASE}/api/music/queue/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });
      const data = await res.json();
      if (data.success) {
        fetchMusicState(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMusicFilterUpdate = async (filterName, toggle, value) => {
    try {
      const res = await fetch(`${API_BASE}/api/music/filters/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filterName, toggle, value })
      });
      const data = await res.json();
      if (data.success) {
        fetchMusicState(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateMusicPlaylist = async (e) => {
    if (e) e.preventDefault();
    if (!musicPlaylistInput.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/music/playlists/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: musicPlaylistInput })
      });
      const data = await res.json();
      if (data.success) {
        alert(`📂 Custom Playlist "${musicPlaylistInput}" created and synchronized!`);
        setMusicPlaylistInput('');
        fetchMusicState(loggedInUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem('cherry_userId');
    localStorage.removeItem('cherry_charName');
    localStorage.removeItem('cherry_isAdmin');
    setLoggedInUser(null);
    setLoggedInCharName('');
    setIsAdmin(false);
    setMyPlots([]);
  };

  const getRemainingTimeString = (plantedAt, cropType) => {
    const growTimes = { 'Wheat': 120000, 'Apple': 300000, 'Berry': 600000 };
    const duration = growTimes[cropType] || 300000;
    const remainingMs = duration - (Date.now() - plantedAt);
    if (remainingMs <= 0) return 'Ready to harvest! 🧺';
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.ceil((remainingMs % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#020617' }}>
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside style={{ width: '280px', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9, 13, 22, 0.65)', backdropFilter: 'blur(20px)', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '28px', position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box', overflowY: 'auto' }}>
        
        {/* LOGO SECTION */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '32px' }}>🍒</span>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '900', margin: 0, letterSpacing: '0.5px' }} className="text-gradient-purple">CHERRY OS</h1>
            <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bot Administration</p>
          </div>
        </div>

        {/* LOGGED IN USER CARD */}
        {loggedInUser ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
              <span style={{ fontSize: '12.5px', color: '#cbd5e1', fontWeight: '800' }}>
                {loggedInCharName}
              </span>
            </div>
            <button 
              onClick={handleLogOut} 
              style={{ background: 'transparent', color: '#ef4444', border: 'none', padding: 0, fontSize: '11px', fontWeight: '750', cursor: 'pointer' }}
            >
              Log Out
            </button>
          </div>
        ) : (
          <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🔒 Read-Only Mode
          </div>
        )}

        {/* CATEGORIZED NAVIGATION TAB LOOPS */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* CATEGORY: ECONOMY & OVERVIEW */}
          <div>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>📈 Economy & Stats</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { tab: 'overview', icon: '📊', label: 'Overview' },
                { tab: 'stocks', icon: '📈', label: 'Stocks Market' },
                { tab: 'leaderboard', icon: '🏆', label: 'Leaderboards' },
                { tab: 'market', icon: '🛒', label: 'Marketplace' },
                { tab: 'players', icon: '👥', label: 'Players List' }
              ].map(item => (
                <button
                  key={item.tab}
                  onClick={() => { setActiveTab(item.tab); setSelectedPlayer(null); }}
                  className={activeTab === item.tab ? 'nav-tab active' : 'nav-tab'}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', fontSize: '12px' }}
                >
                  <span>{item.icon}</span> {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* CATEGORY: RPG PLAYABLE MODULES */}
          {loggedInUser && (
            <div>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>🎮 RPG & Gaming</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { tab: 'inventory', icon: '🎒', label: 'My Inventory' },
                  { tab: 'shop', icon: '🏪', label: 'Valley Shop' },
                  { tab: 'homestead', icon: '🌾', label: 'Homestead' },
                  { tab: 'dungeons', icon: '⚔️', label: 'Dungeons', plugin: 'Dungeons' },
                  { tab: 'guild', icon: '🛡️', label: 'Guild Alliance' },
                  { tab: 'pets', icon: '🐾', label: 'Pet Sanctuary' },
                  { tab: 'business', icon: '💼', label: 'Businesses' },
                  { tab: 'delivery', icon: '📦', label: 'Delivery Jobs' },
                  { tab: 'dinopark', icon: '🦖', label: 'Dino Park' },
                  { tab: 'aquarium', icon: '🐠', label: 'Aquarium' },
                  { tab: 'casino', icon: '🎡', label: 'Casino Games', plugin: 'Casino' }
                ].filter(item => !item.plugin || premiumOSData?.installedPlugins?.includes(item.plugin)).map(item => (
                  <button
                    key={item.tab}
                    onClick={() => { setActiveTab(item.tab); setSelectedPlayer(null); }}
                    className={activeTab === item.tab ? 'nav-tab active' : 'nav-tab'}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', fontSize: '12px' }}
                  >
                    <span>{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORY: SYSTEMS & MANAGEMENT */}
          {loggedInUser && (
            <div>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>⚙️ Administration</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { tab: 'ai_hub', icon: '🤖', label: 'AI Assistant', plugin: 'AI Hub' },
                  { tab: 'server_mod', icon: '🔨', label: 'Moderation' },
                  { tab: 'community', icon: '🤝', label: 'Community Hub' },
                  { tab: 'analytics', icon: '📊', label: 'Activity Heatmap', plugin: 'Analytics' },
                  { tab: 'tickets', icon: '🎟️', label: 'Support Tickets', plugin: 'Support Tickets' },
                  { tab: 'applications', icon: '💼', label: 'Applications Portal' },
                  { tab: 'automation', icon: '⛓️', label: 'Automations Builder' },
                  { tab: 'music', icon: '🎵', label: 'Premium Music', plugin: 'Music' }
                ].filter(item => !item.plugin || premiumOSData?.installedPlugins?.includes(item.plugin)).map(item => (
                  <button
                    key={item.tab}
                    onClick={() => { setActiveTab(item.tab); setSelectedPlayer(null); }}
                    className={activeTab === item.tab ? 'nav-tab active' : 'nav-tab'}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', fontSize: '12px' }}
                  >
                    <span>{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORY: ACCOUNT & SETTINGS */}
          {loggedInUser && (
            <div>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>👤 Account Settings</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { tab: 'profile', icon: '🎨', label: 'Customize Profile' },
                  { tab: 'premium_os', icon: '👑', label: 'Premium Bot OS' },
                  ...(isAdmin ? [{ tab: 'admin', icon: '👑', label: 'Admin Console' }] : [])
                ].map(item => (
                  <button
                    key={item.tab}
                    onClick={() => { setActiveTab(item.tab); setSelectedPlayer(null); }}
                    className={activeTab === item.tab ? 'nav-tab active' : 'nav-tab'}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', fontSize: '12px' }}
                  >
                    <span>{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

        </nav>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* TOP STATUS GLOWING DECORATION BAR */}
        <div style={{ padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9, 13, 22, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>
              Dashboard / {activeTab.toUpperCase()}
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>Real-time server synchronization</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 10px', borderRadius: '20px', fontWeight: '800' }}>
              ● DATABASE ONLINE
            </span>
          </div>
        </div>

        {/* MAIN BODY SCROLL VIEW */}
        <main style={{ padding: '40px', overflowY: 'auto', flexGrow: 1, boxSizing: 'border-box' }}>
        {/* Live Guild Boss Raid Arena Spec */}
        {activeRaid.active && (
          <div className="glass-card raid-boss-card" style={{ marginBottom: '32px', boxShadow: '0 0 35px rgba(239, 68, 68, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(239,68,68,0.2)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '36px' }}>🐉</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#f87171', letterSpacing: '0.5px' }}>BOSS ENCOUNTER: {activeRaid.bossName}</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Live Guild Spectator Arena • Active Multi-player Co-op Encounter</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {loggedInUser && (
                  <button 
                    onClick={() => setActiveTab('guild')}
                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Enter War Room 🛡️
                  </button>
                )}
                <span style={{ background: '#ef4444', color: '#ffffff', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', animation: 'pulse-glow 1s infinite', textTransform: 'uppercase', letterSpacing: '1px' }}>LIVE RAID</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Boss Health Bar */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800', color: '#f87171', marginBottom: '6px' }}>
                    <span>BOSS HEALTH</span>
                    <span>{activeRaid.bossHp?.toLocaleString()} / {activeRaid.bossMaxHp?.toLocaleString()} HP</span>
                  </div>
                  <div className="raid-bar" style={{ height: '16px', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <div className="raid-bar-fill" style={{ width: `${Math.max(0, (activeRaid.bossHp / activeRaid.bossMaxHp) * 100)}%`, background: 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)' }} />
                  </div>
                </div>
                
                {/* Party display */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Guild Combat Party ({activeRaid.party?.length || 0})</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                    {activeRaid.party?.map(p => {
                      const hpPercent = Math.max(0, (p.hp / p.maxHp) * 100);
                      const maxDmgDealt = Math.max(...(activeRaid.party?.map(x => x.dmgDealt) || [1]));
                      const dmgPercent = Math.max(0, (p.dmgDealt / maxDmgDealt) * 100);
                      
                      return (
                        <div key={p.userId} style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.75)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontWeight: '800', display: 'block', color: '#ffffff', fontSize: '12px' }}>{p.username}</span>
                          
                          {/* Player HP */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#ef4444', fontWeight: '700', marginBottom: '2px' }}>
                              <span>HP: {p.hp}/{p.maxHp}</span>
                            </div>
                            <div className="raid-bar" style={{ height: '6px' }}>
                              <div className="raid-bar-fill" style={{ width: `${hpPercent}%`, background: hpPercent > 50 ? '#10b981' : hpPercent > 20 ? '#f59e0b' : '#ef4444' }} />
                            </div>
                          </div>

                          {/* Player Damage Contrib */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#60a5fa', fontWeight: '700', marginBottom: '2px' }}>
                              <span>Dmg Dealt: {p.dmgDealt}</span>
                            </div>
                            <div className="raid-bar" style={{ height: '6px' }}>
                              <div className="raid-bar-fill" style={{ width: `${dmgPercent}%`, background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)' }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Real-time scrolling combat log */}
              <div style={{ background: '#020617', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '16px', height: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: '#f87171', fontWeight: '800', borderBottom: '1px solid rgba(239,68,68,0.1)', paddingBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>BATTLE COMBAT FEED</span>
                <p style={{ margin: 0, fontSize: '12px', color: '#fbcfe8', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{activeRaid.logFeed?.replace(/\*/g, '')}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Gathering ledger details from database...</p>
          </div>
        ) : (
          <>
            {/* Logged In Web Actions Center */}
            {loggedInUser && myCharacter && activeTab === 'overview' && (
              <div className="glass-card glow-violet" style={{ marginBottom: '32px', borderLeft: '4px solid #8b5cf6' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} style={{ color: '#a855f7' }} /> Visual Homestead & Web Controls
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                  {/* Farming plots */}
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '750', color: '#94a3b8' }}>🚜 Real-Time Soil Plots:</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      {[1, 2, 3].map(plotIdx => {
                        const plot = myPlots.find(p => p.plotIndex === plotIdx);
                        const isOccupied = !!plot;

                        return (
                          <div key={plotIdx} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff' }}>Plot #{plotIdx}</span>
                            
                            {isOccupied ? (
                              <>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                  <p style={{ margin: 0 }}>🌾 **Crop:** {plot.cropType}</p>
                                  <p style={{ margin: '2px 0' }}>💧 **Watered:** {plot.watered ? 'Yes' : 'No'}</p>
                                  <p style={{ margin: 0 }}>⏱️ **Time:** {getRemainingTimeString(plot.plantedAt, plot.cropType)}</p>
                                </div>
                                {!plot.watered && (Date.now() - plot.plantedAt < (plot.cropType === 'Wheat' ? 120000 : plot.cropType === 'Apple' ? 300000 : 600000)) && (
                                  <button 
                                    onClick={() => handleWater(plotIdx)}
                                    style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                  >
                                    💧 Water Plot
                                  </button>
                                )}
                                {(Date.now() - plot.plantedAt >= (plot.cropType === 'Wheat' ? 120000 : plot.cropType === 'Apple' ? 300000 : 600000)) && (
                                  <button 
                                    onClick={() => handleHarvest(plotIdx)}
                                    style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                  >
                                    🧺 Harvest Crop
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <select 
                                  value={selectedSeed[plotIdx]} 
                                  onChange={(e) => setSelectedSeed({ ...selectedSeed, [plotIdx]: e.target.value })}
                                  style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px', color: '#ffffff', fontSize: '11px' }}
                                >
                                  <option value="Wheat">Wheat Seed (2m)</option>
                                  <option value="Apple">Apple Seed (5m)</option>
                                  <option value="Berry">Berry Seed (10m)</option>
                                </select>
                                <button 
                                  onClick={() => handlePlant(plotIdx)}
                                  style={{ background: '#10b981', color: '#020617', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                  🌱 Plant Seed
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Stats row */}
                <div className="grid-3">
                  <div className="glass-card glow-emerald" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px', color: '#10b981' }}>
                      <Cherry size={32} />
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Total Circulating Wealth</p>
                      <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0' }}>🍒 {stats.circulatingWealth?.toLocaleString()} cherries</h3>
                    </div>
                  </div>
                  <div className="glass-card glow-violet" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '12px', borderRadius: '12px', color: '#8b5cf6' }}>
                      <Users size={32} />
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Active Players registered</p>
                      <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0' }}>{stats.totalPlayers} Competitors</h3>
                    </div>
                  </div>
                  <div className="glass-card glow-amber" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '12px', color: '#f59e0b' }} className="pulse-indicator">
                      <Gamepad2 size={32} />
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Progressive Slots Jackpot</p>
                      <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0' }} className="text-gradient-gold">🍒 {stats.slotsJackpot?.toLocaleString()}</h3>
                    </div>
                  </div>
                </div>

                {/* Sub row */}
                <div className="grid-2">
                  {/* Market Overview */}
                  <div className="glass-card">
                    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={18} className="text-gradient-cyan" /> Live Tickers</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {stocksData.stocks.map(s => {
                        const change = s.price - s.prevPrice;
                        return (
                          <div key={s.ticker} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }}>
                            <div>
                              <span style={{ fontWeight: '800', color: '#ffffff' }}>{s.ticker}</span>
                              <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '8px' }}>{s.companyName}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: '750' }}>🍒 {s.price}</span>
                              <span style={{ fontSize: '11px', marginLeft: '8px', color: change >= 0 ? '#10b981' : '#ef4444' }}>
                                {change >= 0 ? `▲ +${change}` : `▼ ${change}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hot Quest notices */}
                  <div className="glass-card">
                    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Crown size={18} className="text-gradient-gold" /> Active Guild Notice</h3>
                    <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px' }}>
                      <div style={{ fontSize: '28px' }}>📢</div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '750', color: '#fbbf24' }}>{stats.announcement?.title || 'Notice Board'}</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
                          {stats.announcement?.content || 'Welcome to Cherry! Visit the Discord to create a character.'}
                        </p>
                      </div>
                    </div>
                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Connected servers:</span>
                        <span style={{ fontSize: '13px', fontWeight: '700', marginLeft: '8px', color: '#ffffff' }}>{stats.activeGuilds} guilds</span>
                      </div>
                      <span style={{ background: '#10b981', color: '#020617', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>ONLINE</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: STOCKS */}
            {activeTab === 'stocks' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '24px' }}>
                {/* Stock Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {stocksData.stocks.map(s => {
                    const change = s.price - s.prevPrice;
                    const isActive = s.ticker === selectedStock;
                    return (
                      <div 
                        key={s.ticker} 
                        onClick={() => setSelectedStock(s.ticker)}
                        className="glass-card"
                        style={{ 
                          cursor: 'pointer', 
                          padding: '16px', 
                          border: isActive ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.08)',
                          background: isActive ? 'rgba(139, 92, 246, 0.08)' : 'rgba(15, 23, 42, 0.65)'
                        }}
                      >
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>{s.ticker}</h4>
                        <p style={{ margin: '2px 0 8px 0', fontSize: '11px', color: '#94a3b8' }}>{s.companyName}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '750', fontSize: '14px' }}>🍒 {s.price}</span>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: change >= 0 ? '#10b981' : '#ef4444' }}>
                            {change >= 0 ? `▲ +${change}` : `▼ ${change}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Stock Detailed Chart & News */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="glass-card" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{activeStockDetails?.companyName} ({activeStockDetails?.ticker})</h3>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Real-time valuation trends (ticks 1-30)</p>
                      </div>
                      <span style={{ fontSize: '20px', fontWeight: '800', color: '#fbbf24' }}>🍒 {activeStockDetails?.price}</span>
                    </div>

                    <div style={{ flex: 1, minHeight: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="tick" stroke="#475569" fontSize={10} />
                          <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} />
                          <Tooltip 
                            contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                            labelFormatter={(label) => `Tick Update #${label}`}
                          />
                          <Area type="monotone" dataKey="price" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#chartColor)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
 
                  {/* Stock Broker Terminal */}
                  <div className="glass-card glow-amber" style={{ borderLeft: '4px solid #fbbf24' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={18} style={{ color: '#fbbf24' }} /> CSX Web Broker Terminal
                    </h3>
                    {loggedInUser && selectedStock ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: '750' }}>YOUR POSITION</span>
                            <h4 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
                              {myPortfolio.find(p => p.ticker === selectedStock)?.shares || 0} Shares Owned
                            </h4>
                            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>
                              Equity Value: 🍒 {((myPortfolio.find(p => p.ticker === selectedStock)?.shares || 0) * (activeStockDetails?.price || 0)).toFixed(2)}
                            </p>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: '750' }}>ESTIMATED TOTAL PORTFOLIO</span>
                            <h4 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '800', color: '#fbbf24' }}>
                              🍒 {myPortfolio.reduce((acc, curr) => acc + curr.totalValue, 0).toLocaleString()}
                            </h4>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>Shares:</span>
                            <input 
                              type="number" 
                              placeholder="Qty"
                              value={stockSharesInput}
                              onChange={(e) => setStockSharesInput(Math.max(1, parseInt(e.target.value) || 0))}
                              style={{ flex: 1, background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px', fontSize: '13px' }}
                            />
                          </div>
                          {stockSharesInput && activeStockDetails && (
                            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>
                              Cost / Revenue: 🍒 {(parseInt(stockSharesInput) * activeStockDetails.price).toLocaleString()} cherries
                            </p>
                          )}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <button 
                              onClick={() => handleBuyStock(selectedStock)}
                              style={{ background: '#10b981', color: '#000000', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                            >
                              Buy Shares
                            </button>
                            <button 
                              onClick={() => handleSellStock(selectedStock)}
                              style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                            >
                              Sell Shares
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontStyle: 'italic', background: 'rgba(0,0,0,0.1)', borderRadius: '10px' }}>
                        ⚠️ Please log in to trade stocks directly from the portal.
                      </div>
                    )}
                  </div>

                  {/* Financial news */}
                  <div className="glass-card">
                    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={18} className="text-gradient-gold" /> Ticker News Bulletins</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {stocksData.news.map((item, idx) => (
                        <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', borderLeft: '3px solid #f59e0b' }}>
                          <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '750', color: '#f8fafc' }}>{item.headline}</h5>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: LEADERBOARD */}
            {activeTab === 'leaderboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🏆 Guild Rankings Leaderboard</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Filter rankings by wealth, overall combat level, or individual RPG skills</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '750' }}>Rank By:</span>
                    <select
                      className="leaderboard-select"
                      value={selectedLeaderboardSkill}
                      onChange={(e) => {
                        setSelectedLeaderboardSkill(e.target.value);
                        if (e.target.value !== 'combat') {
                          fetchSkillLeaderboard(e.target.value);
                        }
                      }}
                    >
                      <option value="combat">⚔️ Combat Level</option>
                      <option value="mining">⛏️ Mining Skill</option>
                      <option value="fishing">🎣 Fishing Skill</option>
                      <option value="smithing">🔨 Smithing Skill</option>
                      <option value="woodcutting">🪵 Woodcutting Skill</option>
                      <option value="cooking">🍳 Cooking Skill</option>
                      <option value="alchemy">🧪 Alchemy Skill</option>
                      <option value="magic">🔮 Magic Skill</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  {/* Wealth */}
                  <div className="glass-card">
                    <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><Cherry size={20} style={{ color: '#fbbf24' }} /> Bank Wealth Rankings</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {leaderboard.wealth.map((u, index) => (
                        <div key={u.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: '800', width: '20px', color: index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : index === 2 ? '#b45309' : '#475569' }}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </span>
                            <img src={u.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
                            <div>
                              <p style={{ margin: 0, fontSize: '13px', fontWeight: '750', color: '#ffffff' }}>{u.username}</p>
                              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>ID: {u.userId}</p>
                            </div>
                          </div>
                          <span style={{ fontWeight: '800', color: '#fbbf24' }}>🍒 {u.coins?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Category (Combat / Skill) */}
                  <div className="glass-card">
                    <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Flame size={20} style={{ color: '#ec4899' }} /> 
                      {selectedLeaderboardSkill === 'combat' ? 'Combat Level Rankings' : `${selectedLeaderboardSkill.charAt(0).toUpperCase() + selectedLeaderboardSkill.slice(1)} Skill Rankings`}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedLeaderboardSkill === 'combat' ? (
                        leaderboard.combat.map((u, index) => (
                          <div key={u.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontWeight: '800', width: '20px', color: index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : index === 2 ? '#b45309' : '#475569' }}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                              </span>
                              <img src={u.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
                              <div>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: '750', color: '#ffffff' }}>{u.username}</p>
                                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>ID: {u.userId}</p>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: '800', color: '#ec4899', fontSize: '13px' }}>Lvl {u.level}</span>
                              <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>{u.xp} XP</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        skillLeaderboardList.map((u, index) => (
                          <div key={u.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontWeight: '800', width: '20px', color: index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : index === 2 ? '#b45309' : '#475569' }}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                              </span>
                              <img src={u.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
                              <div>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: '750', color: '#ffffff' }}>{u.username}</p>
                                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>ID: {u.userId}</p>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: '800', color: '#a855f7', fontSize: '14px' }}>Lvl {u.skillLevel}</span>
                              <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>🍒 {u.coins?.toLocaleString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                      {selectedLeaderboardSkill !== 'combat' && skillLeaderboardList.length === 0 && (
                        <p style={{ fontStyle: 'italic', color: '#64748b', textAlign: 'center', padding: '20px' }}>Loading skill rankings...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: AUCTION HOUSE */}
            {activeTab === 'market' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}><ShoppingBag style={{ inline: 'block', marginRight: '6px' }} size={20} /> Web Auction House</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Browse user-listed items for sale or purchase directly</p>
                  </div>
                  {loggedInUser && (
                    <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                      Wallet Balance: 🍒 {myCharacter?.coins?.toLocaleString()} cherries
                    </span>
                  )}
                </div>

                {loggedInUser && (
                  <div className="glass-card glow-violet" style={{ borderLeft: '4px solid #8b5cf6', marginBottom: '8px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800' }}>🛍️ Create Web Auction Listing</h3>
                    <form onSubmit={handleCreateMarketListing} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Select Item to Sell</label>
                        <select
                          className="premium-input"
                          value={listMarketItem}
                          onChange={(e) => setListMarketItem(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        >
                          <option value="">-- Choose Item from Bag --</option>
                          {myInventory.map((item, idx) => (
                            <option key={idx} value={item.itemName}>
                              {item.itemName} (x{item.quantity} owned)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Quantity</label>
                        <input
                          type="number"
                          placeholder="e.g. 1"
                          value={listMarketQty}
                          onChange={(e) => setListMarketQty(Math.min(myInventory.find(i => i.itemName === listMarketItem)?.quantity || 1, Math.max(1, parseInt(e.target.value) || 1)))}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Price per Unit (🍒)</label>
                        <input
                          type="number"
                          placeholder="e.g. 100"
                          value={listMarketPrice}
                          onChange={(e) => setListMarketPrice(Math.max(1, parseInt(e.target.value) || 1))}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                      <button
                        type="submit"
                        style={{
                          background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(168,85,247,0.25)'
                        }}
                      >
                        Publish Listing
                      </button>
                    </form>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {listings.map(l => (
                    <div key={l.id} className="glass-card glow-amber" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid #fbbf24' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>{l.itemName}</h4>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Seller: @{l.sellerName}</span>
                        </div>
                        <span style={{ fontSize: '12px', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontWeight: '750' }}>x{l.quantity}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 16px', borderRadius: '10px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>PRICE</span>
                          <span style={{ fontWeight: '800', color: '#fbbf24', fontSize: '15px' }}>🍒 {l.price?.toLocaleString()}</span>
                        </div>

                        {loggedInUser ? (
                          l.sellerId === loggedInUser ? (
                            <span style={{ fontSize: '11px', color: '#64748b', italic: 'true' }}>Your listing</span>
                          ) : (
                            <button 
                              onClick={() => handleBuyListing(l.id)}
                              style={{ background: '#fbbf24', color: '#000000', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '750', cursor: 'pointer' }}
                            >
                              Buy Item
                            </button>
                          )
                        ) : (
                          <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={10} /> Login to buy</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {listings.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <p style={{ margin: 0, fontStyle: 'italic' }}>There are currently no active listings in the market.</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>List items in Discord using `/marketplace sell`!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: CRAFTING STATION */}
            {activeTab === 'craft' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}><Hammer style={{ inline: 'block', marginRight: '6px' }} size={20} /> Blacksmith & Alchemy Station</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Forge weapons/shields and brew healing potions using gathered resources</p>
                  </div>
                  {loggedInUser && (
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: '750', color: '#10b981' }}>
                      <span>🔨 Smithing: Lvl {myCharacter?.skills?.smithing}</span>
                      <span>🧪 Alchemy: Lvl {myCharacter?.skills?.alchemy}</span>
                      <span>🍳 Cooking: Lvl {myCharacter?.skills?.cooking || 1}</span>
                    </div>
                  )}
                </div>

                {/* Crafting Sub Tabs */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                  {[
                    { id: 'recipes', name: '🔨 Recipes & Blueprints' },
                    { id: 'enhance', name: '💎 Gear Enhancer Anvil' }
                  ].map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setCraftSubTab(sub.id)}
                      className={craftSubTab === sub.id ? 'nav-tab active' : 'nav-tab'}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>

                {/* Sub-tab: Recipes */}
                {craftSubTab === 'recipes' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {RECIPES_CATALOG.map(r => (
                      <div key={r.id} className="glass-card glow-violet" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: r.type === 'Forge' ? '4px solid #a855f7' : r.type === 'Brew' ? '4px solid #ec4899' : '4px solid #f59e0b' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '32px' }}>{r.emoji}</span>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>{r.name}</h4>
                            <span style={{ fontSize: '10px', padding: '2px 6px', background: r.type === 'Forge' ? 'rgba(168,85,247,0.1)' : r.type === 'Brew' ? 'rgba(236,72,153,0.1)' : 'rgba(245,158,11,0.1)', color: r.type === 'Forge' ? '#c084fc' : r.type === 'Brew' ? '#f472b6' : '#fbbf24', borderRadius: '4px', fontWeight: '700' }}>
                              {r.type.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1' }}>{r.desc}</p>
                        
                        {/* Material checklist */}
                        <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', fontSize: '11px' }}>
                          <span style={{ color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: '750' }}>RECIPE INGREDIENTS:</span>
                          {Object.entries(r.mats).map(([mat, qty]) => (
                            <div key={mat} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span style={{ color: '#ffffff' }}>• {mat}</span>
                              <span style={{ fontWeight: '750', color: '#94a3b8' }}>Need {qty}x</span>
                            </div>
                          ))}
                        </div>

                        {r.type === 'Cook' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>🔥 Stove Heat:</span>
                            <select 
                              value={webHeatLevels[r.id] || 'Low'}
                              onChange={(e) => setWebHeatLevels({...webHeatLevels, [r.id]: e.target.value})}
                              style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                            >
                              <option value="Low">Low Heat 🔹</option>
                              <option value="Medium">Medium Heat 🔸</option>
                              <option value="High">High Heat 🔺</option>
                            </select>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                          <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Req: {r.req}</span>

                          {loggedInUser ? (
                            <button 
                              onClick={() => r.type === 'Cook' ? handleCookItem(r.id, webHeatLevels[r.id] || 'Low') : handleCraftItem(r.id)}
                              style={{ background: r.type === 'Forge' ? '#a855f7' : r.type === 'Brew' ? '#ec4899' : '#d97706', color: '#ffffff', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '750', cursor: 'pointer' }}
                            >
                              {r.type === 'Forge' ? 'Forge Item' : r.type === 'Brew' ? 'Brew Potion' : 'Cook Dish'}
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={10} /> Login to craft</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sub-tab: Enhance */}
                {craftSubTab === 'enhance' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
                    {/* Left: Setup & Checklist */}
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>💎 Gear Enhancement Station</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#cbd5e1' }}>Select a forged weapon or shield to reinforce its combat attributes.</p>
                      </div>

                      {/* Selector */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>CHOOSE PIECE OF EQUIPMENT:</label>
                        <select
                          value={enhanceBaseName}
                          onChange={(e) => setEnhanceBaseName(e.target.value)}
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          <option value="Iron Sword">⚔️ Iron Sword (+5 STR)</option>
                          <option value="Oak Bow">🏹 Oak Bow (+5 DEX)</option>
                          <option value="Magic Staff">🔮 Magic Staff (+5 INT)</option>
                          <option value="Gold Sword">🔱 Gold Sword (+8 STR)</option>
                          <option value="Wooden Shield">🛡️ Wooden Shield (+3 DEF)</option>
                          <option value="Plated Shield">🧱 Plated Shield (+6 DEF)</option>
                          <option value="Gold Ring">💍 Gold Ring (+5 LUC)</option>
                        </select>
                      </div>

                      {enhanceStatus && !enhanceStatus.owned && (
                        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#cbd5e1', fontSize: '12px', textAlign: 'center' }}>
                          ⚠️ **You do not own any version of this equipment in your inventory!**
                          <br />
                          Forge the base item under the "Recipes" sub-tab first.
                        </div>
                      )}

                      {enhanceStatus && enhanceStatus.owned && (
                        <>
                          {/* Item Upgrade Level & Stat Scale */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div>
                              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>CURRENT GEAR:</span>
                              <strong style={{ fontSize: '13px', color: '#ffffff' }}>{enhanceStatus.currentItem}</strong>
                              <span style={{ fontSize: '11px', color: '#c084fc', display: 'block', marginTop: '2px' }}>
                                Modifier: {enhanceStatus.currentBonus?.stat.replace('stat_', '').toUpperCase()} +{enhanceStatus.currentBonus?.bonus}
                              </span>
                            </div>
                            <div>
                              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>NEXT TIER TARGET:</span>
                              {enhanceStatus.maxed ? (
                                <strong style={{ fontSize: '13.5px', color: '#fbbf24' }}>MAX LEVEL REACHED (+10) 🌟</strong>
                              ) : (
                                <>
                                  <strong style={{ fontSize: '13px', color: '#ffffff' }}>{enhanceStatus.nextItem}</strong>
                                  <span style={{ fontSize: '11px', color: '#34d399', display: 'block', marginTop: '2px' }}>
                                    Modifier: {enhanceStatus.nextBonus?.stat.replace('stat_', '').toUpperCase()} +{enhanceStatus.nextBonus?.bonus}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {!enhanceStatus.maxed && (
                            <>
                              {/* Materials Checklist */}
                              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span style={{ color: '#64748b', fontWeight: 'bold' }}>REQUIRED MATERIALS:</span>
                                
                                {enhanceStatus.req.stones > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>• Stone</span>
                                    <span style={{ fontWeight: '800', color: (myInventory.find(i => i.itemName === 'Stone')?.quantity || 0) >= enhanceStatus.req.stones ? '#34d399' : '#f87171' }}>
                                      {myInventory.find(i => i.itemName === 'Stone')?.quantity || 0} / {enhanceStatus.req.stones}
                                    </span>
                                  </div>
                                )}

                                {enhanceStatus.req.coal > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>• Coal</span>
                                    <span style={{ fontWeight: '800', color: (myInventory.find(i => i.itemName === 'Coal')?.quantity || 0) >= enhanceStatus.req.coal ? '#34d399' : '#f87171' }}>
                                      {myInventory.find(i => i.itemName === 'Coal')?.quantity || 0} / {enhanceStatus.req.coal}
                                    </span>
                                  </div>
                                )}

                                {enhanceStatus.req.iron > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>• Iron Ore</span>
                                    <span style={{ fontWeight: '800', color: (myInventory.find(i => i.itemName === 'Iron Ore')?.quantity || 0) >= enhanceStatus.req.iron ? '#34d399' : '#f87171' }}>
                                      {myInventory.find(i => i.itemName === 'Iron Ore')?.quantity || 0} / {enhanceStatus.req.iron}
                                    </span>
                                  </div>
                                )}

                                {enhanceStatus.req.gold > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>• Gold Ore</span>
                                    <span style={{ fontWeight: '800', color: (myInventory.find(i => i.itemName === 'Gold Ore')?.quantity || 0) >= enhanceStatus.req.gold ? '#34d399' : '#f87171' }}>
                                      {myInventory.find(i => i.itemName === 'Gold Ore')?.quantity || 0} / {enhanceStatus.req.gold}
                                    </span>
                                  </div>
                                )}

                                {enhanceStatus.req.diamonds > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>• Diamond</span>
                                    <span style={{ fontWeight: '800', color: (myInventory.find(i => i.itemName === 'Diamond')?.quantity || 0) >= enhanceStatus.req.diamonds ? '#34d399' : '#f87171' }}>
                                      {myInventory.find(i => i.itemName === 'Diamond')?.quantity || 0} / {enhanceStatus.req.diamonds}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={handleAttemptEnhance}
                                disabled={
                                  enhanceLoading ||
                                  (enhanceStatus.req.stones > 0 && (myInventory.find(i => i.itemName === 'Stone')?.quantity || 0) < enhanceStatus.req.stones) ||
                                  (enhanceStatus.req.coal > 0 && (myInventory.find(i => i.itemName === 'Coal')?.quantity || 0) < enhanceStatus.req.coal) ||
                                  (enhanceStatus.req.iron > 0 && (myInventory.find(i => i.itemName === 'Iron Ore')?.quantity || 0) < enhanceStatus.req.iron) ||
                                  (enhanceStatus.req.gold > 0 && (myInventory.find(i => i.itemName === 'Gold Ore')?.quantity || 0) < enhanceStatus.req.gold) ||
                                  (enhanceStatus.req.diamonds > 0 && (myInventory.find(i => i.itemName === 'Diamond')?.quantity || 0) < enhanceStatus.req.diamonds)
                                }
                                style={{
                                  width: '100%',
                                  background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '12px',
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                  boxShadow: '0 4px 10px rgba(168,85,247,0.25)'
                                }}
                              >
                                {enhanceLoading ? 'Stoking furnace...' : `Attempt Enhancement (${enhanceStatus.req.rate}% success rate)`}
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {/* Right: Anvil graphic / Result summary */}
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#a855f7', fontWeight: '800', letterSpacing: '1px' }}>SMITHING ANVIL</span>

                      {/* Graphic Anvil Box */}
                      <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '16px 0' }} className={enhanceLoading ? 'shaking-anvil' : ''}>
                        {/* Glowing aura */}
                        <div style={{
                          position: 'absolute',
                          width: '100px',
                          height: '100px',
                          borderRadius: '50%',
                          background: enhanceOutcome?.result === 'success' ? 'rgba(16,185,129,0.15)' : enhanceOutcome?.result === 'fail' ? 'rgba(239,68,68,0.15)' : 'rgba(168,85,247,0.15)',
                          filter: 'blur(15px)'
                        }} />
                        <span style={{ fontSize: '72px', zIndex: 2 }}>🔨</span>
                      </div>

                      {/* Upgrade Outcome Summary Banner */}
                      {enhanceOutcome && (
                        <div style={{
                          width: '100%',
                          padding: '14px',
                          background: enhanceOutcome.result === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          border: enhanceOutcome.result === 'success' ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)',
                          borderRadius: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <h5 style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', color: enhanceOutcome.result === 'success' ? '#34d399' : '#f87171' }}>
                            {enhanceOutcome.result === 'success' ? '🎉 UPGRADE SUCCESSFUL!' : '💥 ENHANCEMENT FAILED'}
                          </h5>
                          <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>
                            {enhanceOutcome.result === 'success' ? (
                              `Your equipment advanced to ${enhanceOutcome.newItem}!`
                            ) : (
                              enhanceOutcome.penaltyText
                            )}
                          </p>
                          <button
                            onClick={() => setEnhanceOutcome(null)}
                            style={{ background: 'rgba(255,255,255,0.05)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '6px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', marginTop: '4px' }}
                          >
                            Acknowledge
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PLAYERS EXPLORER */}
            {activeTab === 'players' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Search header */}
                <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>RPG Player Registry</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Search active character cards and core stats</p>
                  </div>
                  <div style={{ position: 'relative', width: '250px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }} />
                    <input 
                      type="text" 
                      placeholder="Search character..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px 8px 36px', 
                        borderRadius: '8px', 
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: '#090d16',
                        color: '#ffffff',
                        fontSize: '12px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Player Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {filteredPlayers.map(p => (
                    <div 
                      key={p.userId} 
                      onClick={() => setSelectedPlayer(p)}
                      className="glass-card glow-violet"
                      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid #a855f7' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={p.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid #a855f7' }} alt="" />
                        <div>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>{p.charName}</h4>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>@{p.username}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px' }}>
                        <div>
                          <span style={{ color: '#64748b' }}>Class:</span>
                          <span style={{ fontWeight: '750', marginLeft: '6px' }}>{p.class}</span>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Level:</span>
                          <span style={{ fontWeight: '750', marginLeft: '6px', color: '#a855f7' }}>{p.level}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#94a3b8' }}>
                        <span>⚔️ {p.weapon.split(' +')[0]}</span>
                        <span>🛡️ {p.shield.split(' +')[0]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: HOMESTEAD & ESTATES */}
            {activeTab === 'homestead' && loggedInUser && homesteadData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🏡 Visual Homestead & Estate Controls</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Manage properties, collect passive rental cherries, and clone dinosaurs in your park</p>
                  </div>
                  <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                    Wallet Balance: 🍒 {myCharacter?.coins?.toLocaleString()} cherries
                  </span>
                </div>

                <div className="homestead-grid">
                  {/* House stats */}
                  <div className="homestead-card glow-violet">
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '32px' }}>🏡</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>Your Dwelling</h4>
                        <span style={{ fontSize: '11px', color: '#a855f7', fontWeight: '700' }}>Type: {homesteadData.house.houseType || 'Camp Tent'}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, minHeight: '40px' }}>
                      {homesteadData.house.houseType === 'Tiny Cottage' ? 'A cozy small wooden structure suited for basic resting.' :
                       homesteadData.house.houseType === 'Mansion' ? 'A grand brick manor with columns and high vaulted ceilings.' :
                       homesteadData.house.houseType === 'Castle' ? 'An imposing stone fortress overlooking the valleys.' :
                       'A default resting camp. Upgrade your dwelling in Discord via `/house buy`!'}
                    </p>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#94a3b8' }}>Dwelling Upgrade Level:</span>
                        <span style={{ color: '#ffffff', fontWeight: '700' }}>Lvl {homesteadData.house.upgradeLevel || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fish aquarium */}
                  <div className="homestead-card glow-blue">
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '32px' }}>🐠</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>Aquarium Fish Tank</h4>
                        <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>Fish Count: {homesteadData.aquarium.fishCount || 0}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, minHeight: '40px' }}>
                      Earns passive cherries hourly from visitors. Adopt more fish in Discord using `/fish`!
                    </p>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Hourly Income:</span>
                        <span style={{ color: '#fbbf24', fontWeight: '800' }}>🍒 {(homesteadData.aquarium.fishCount || 0) * 30}/hr</span>
                      </div>
                    </div>
                    <button
                      onClick={handleCollectAquarium}
                      disabled={!homesteadData.aquarium.fishCount || homesteadData.aquarium.fishCount <= 0}
                      style={{ background: '#38bdf8', color: '#000000', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '750', cursor: 'pointer', opacity: (!homesteadData.aquarium.fishCount || homesteadData.aquarium.fishCount <= 0) ? 0.5 : 1 }}
                    >
                      Collect Aquarium Earnings
                    </button>
                  </div>

                  {/* Dinosaur Park */}
                  <div className="homestead-card glow-emerald">
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '32px' }}>Rex🦖</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>Dinosaur Safari Park</h4>
                        <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700' }}>Dinos Count: {homesteadData.dinoPark.dinos || 0}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: 'auto' }}>
                      <span>Security Grade: **Lvl {homesteadData.dinoPark.securityLevel || 1}**</span>
                      <span>Visitor cherries payout: **🍒 {(homesteadData.dinoPark.dinos || 0) * 120}/hr**</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                      <button
                        onClick={handleCloneDino}
                        style={{ background: '#fbbf24', color: '#000000', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '11px', fontWeight: '750', cursor: 'pointer' }}
                      >
                        Clone Dino (🍒 2K)
                      </button>
                      <button
                        onClick={handleCollectDino}
                        disabled={!homesteadData.dinoPark.dinos || homesteadData.dinoPark.dinos <= 0}
                        style={{ background: '#34d399', color: '#000000', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '11px', fontWeight: '750', cursor: 'pointer', opacity: (!homesteadData.dinoPark.dinos || homesteadData.dinoPark.dinos <= 0) ? 0.5 : 1 }}
                      >
                        Collect Payout
                      </button>
                    </div>
                  </div>

                  {/* Homestead Livestock Pasture Card */}
                  <div className="homestead-card glow-amber">
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '32px' }}>🐄</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>Homestead Livestock Barn</h4>
                        <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '700' }}>
                          Population: 🐔 {farmAnimals?.chickens || 0} Chickens | 🐄 {farmAnimals?.cows || 0} Cows
                        </span>
                      </div>
                    </div>
                    
                    <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, minHeight: '40px' }}>
                      Raise farm animals to harvest agricultural goods. Payouts accumulate passively at **🍒 {((farmAnimals?.chickens || 0) * 5) + ((farmAnimals?.cows || 0) * 20)}/hr**.
                    </p>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Accrued Yields:</span>
                        <span style={{ color: '#fbbf24', fontWeight: '850' }}>
                          🍒 {(() => {
                            if (!farmAnimals) return 0;
                            const hours = (Date.now() - farmAnimals.lastHarvested) / (3600 * 1000);
                            const hourly = (farmAnimals.chickens * 5) + (farmAnimals.cows * 20);
                            return Math.max(0, Math.floor(hours * hourly));
                          })()} cherries
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        Last Harvested: {farmAnimals?.lastHarvested ? new Date(farmAnimals.lastHarvested).toLocaleString() : 'Never'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                          onClick={() => handleBuyFarmAnimal('chicken')}
                          disabled={(myCharacter?.coins || 0) < 2000}
                          style={{
                            background: '#fbbf24',
                            color: '#000000',
                            border: 'none',
                            padding: '8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '800',
                            cursor: (myCharacter?.coins || 0) < 2000 ? 'not-allowed' : 'pointer',
                            opacity: (myCharacter?.coins || 0) < 2000 ? 0.6 : 1
                          }}
                        >
                          Buy Chicken (🍒 2K)
                        </button>
                        <button
                          onClick={() => handleBuyFarmAnimal('cow')}
                          disabled={(myCharacter?.coins || 0) < 6000}
                          style={{
                            background: '#fb7185',
                            color: '#ffffff',
                            border: 'none',
                            padding: '8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '800',
                            cursor: (myCharacter?.coins || 0) < 6000 ? 'not-allowed' : 'pointer',
                            opacity: (myCharacter?.coins || 0) < 6000 ? 0.6 : 1
                          }}
                        >
                          Buy Cow (🍒 6K)
                        </button>
                      </div>

                      <button
                        onClick={handleCollectFarmYield}
                        disabled={isHarvesting || !farmAnimals || ((farmAnimals.chickens * 5) + (farmAnimals.cows * 20) <= 0)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(16,185,129,0.25)'
                        }}
                      >
                        {isHarvesting ? 'Harvesting pasturage...' : 'Harvest Animal Payouts'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real estate list */}
                <div className="glass-card">
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800' }}>🏢 Real Estate Portfolio</h3>
                  <div className="rent-list">
                    {homesteadData.properties.map(p => (
                      <div key={p.id} className="rent-item">
                        <div>
                          <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '750', color: '#ffffff' }}>{p.propertyName}</h5>
                          <span style={{ fontSize: '10px', padding: '2px 6px', background: p.status === 'Rented' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: p.status === 'Rented' ? '#10b981' : '#f87171', borderRadius: '4px', fontWeight: '700', marginRight: '8px' }}>
                            {p.status.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Rental Rate: 🍒 {p.rentRate || 50}/hr</span>
                        </div>
                        {p.status === 'Rented' ? (
                          <button
                            onClick={() => handleCollectRent(p.id)}
                            style={{ background: '#10b981', color: '#000000', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '11px', fontWeight: '750', cursor: 'pointer' }}
                          >
                            Collect Rent
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>Waiting for tenant</span>
                        )}
                      </div>
                    ))}
                    {homesteadData.properties.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontStyle: 'italic' }}>
                        You do not own any real estate properties yet. Buy properties in Discord using `/realestate buy`!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DUNGEONS & QUESTS */}
            {activeTab === 'dungeons' && loggedInUser && myCharacter && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>⚔️ Visual Dungeon Crawler & Raid Arena</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Wager your RPG stats and enter deep dungeons to fight bosses for rare loot and experience.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                      Combat Level: Lvl {myCharacter.level}
                    </span>
                    <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                      Skill Combat: Lvl {myCharacter.skills?.combat || 1}
                    </span>
                  </div>
                </div>

                <div className="grid-2">
                  {/* Left Column: Character Stats & Quick Consumables */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card glow-violet" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#a855f7' }}>🛡️ Character Vitality Status</h4>
                      
                      {/* HP Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#ef4444', fontWeight: '700', marginBottom: '4px' }}>
                          <span>HEALTH (HP)</span>
                          <span>{myCharacter.hp} / {myCharacter.maxHp} HP</span>
                        </div>
                        <div className="raid-bar" style={{ height: '12px' }}>
                          <div className="raid-bar-fill" style={{ width: `${(myCharacter.hp / myCharacter.maxHp) * 100}%`, background: 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)' }} />
                        </div>
                      </div>

                      {/* Mana Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#3b82f6', fontWeight: '700', marginBottom: '4px' }}>
                          <span>MANA (MP)</span>
                          <span>{myCharacter.mana} / {myCharacter.maxMana} Mana</span>
                        </div>
                        <div className="raid-bar" style={{ height: '12px' }}>
                          <div className="raid-bar-fill" style={{ width: `${(myCharacter.mana / myCharacter.maxMana) * 100}%`, background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)' }} />
                        </div>
                      </div>

                      {/* Equipment */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                        <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Weapon Slot</span>
                          <span style={{ fontWeight: '800', color: '#ffffff' }}>⚔️ {myCharacter.weapon || 'None'}</span>
                        </div>
                        <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Shield Slot</span>
                          <span style={{ fontWeight: '800', color: '#ffffff' }}>🛡️ {myCharacter.shield || 'None'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Potion Consumable Healing Bar */}
                    <div className="glass-card glow-emerald" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#10b981' }}>🧪 Quick-Heal Adventure Belt</h4>
                      <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>Consume potions directly from your visual adventurer bag to prepare for the next battle.</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* Health Potion */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: '750', color: '#ffffff' }}>Health Potion 🧪</span>
                            <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                              x{myInventory.find(i => i.itemName === 'Health Potion')?.quantity || 0}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '10px', color: '#cbd5e1' }}>Restores +50 HP points.</p>
                          <button
                            onClick={() => handleHeal('health_potion')}
                            disabled={(myInventory.find(i => i.itemName === 'Health Potion')?.quantity || 0) <= 0 || myCharacter.hp >= myCharacter.maxHp}
                            style={{ background: '#10b981', color: '#000000', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Drink Potion
                          </button>
                        </div>

                        {/* Mana Potion */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: '750', color: '#ffffff' }}>Mana Potion 🌀</span>
                            <span style={{ fontSize: '11px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                              x{myInventory.find(i => i.itemName === 'Mana Potion')?.quantity || 0}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '10px', color: '#cbd5e1' }}>Restores +40 MP points.</p>
                          <button
                            onClick={() => handleHeal('mana_potion')}
                            disabled={(myInventory.find(i => i.itemName === 'Mana Potion')?.quantity || 0) <= 0 || myCharacter.mana >= myCharacter.maxMana}
                            style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Drink Potion
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Active Combat Window / Dungeon Select */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {!combatActive ? (
                      <>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>🌲 Select Dungeon Region</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {[
                            { id: 'goblin', name: 'Goblin Forest', lvl: 1, monster: 'Goblin Scout 👺', hp: 60, dmg: 8, reward: 'Loot: Twigs, Seaweed, Coal (+40 XP)' },
                            { id: 'mines', name: 'Deep Coal Mines', lvl: 3, monster: 'Iron Golem 🤖', hp: 120, dmg: 14, reward: 'Loot: Iron Ore, Coal, Seaweed (+90 XP)' },
                            { id: 'magma', name: 'Magma Caverns', lvl: 6, monster: 'Flame Elemental 🔥', hp: 200, dmg: 22, reward: 'Loot: Gold Ore, Diamonds (+180 XP)' }
                          ].map(dung => {
                            const isLocked = myCharacter.level < dung.lvl;
                            const isSelected = selectedDungeon === dung.id;

                            return (
                              <div
                                key={dung.id}
                                onClick={() => !isLocked && setSelectedDungeon(dung.id)}
                                className={`dungeon-card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                                style={{
                                  padding: '16px',
                                  background: isSelected ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255,255,255,0.01)',
                                  border: isSelected ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.06)',
                                  borderRadius: '12px',
                                  cursor: isLocked ? 'not-allowed' : 'pointer',
                                  opacity: isLocked ? 0.4 : 1,
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '850', color: isSelected ? '#c084fc' : '#ffffff' }}>{dung.name}</h5>
                                  <span style={{ fontSize: '11px', fontWeight: '800', color: isLocked ? '#ef4444' : '#10b981' }}>
                                    {isLocked ? `Req Lvl ${dung.lvl} 🔒` : `Lv. ${dung.lvl}+ Allowed`}
                                  </span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  <span>Monster: **{dung.monster}** (HP: {dung.hp} | DMG: {dung.dmg})</span>
                                  <span style={{ color: '#cbd5e1' }}>{dung.reward}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          onClick={handleStartDungeon}
                          disabled={myCharacter.hp <= 10}
                          style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: '800',
                            cursor: myCharacter.hp <= 10 ? 'not-allowed' : 'pointer',
                            marginTop: '8px',
                            boxShadow: '0 4px 12px rgba(168,85,247,0.3)'
                          }}
                        >
                          {myCharacter.hp <= 10 ? 'HP Too Low to Battle! Heal First.' : `Enter ${selectedDungeon === 'goblin' ? 'Goblin Forest' : selectedDungeon === 'mines' ? 'Deep Coal Mines' : 'Magma Caverns'} (Fight!)`}
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#a855f7' }}>⚔️ Active Battle Arena</h4>
                          {isCombatLoading && (
                            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '10px', height: '10px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                              Resolving combat round...
                            </span>
                          )}
                        </div>

                        {dungeonSession && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', margin: '4px 0' }}>
                            {/* Player Side */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#ffffff', display: 'block' }}>🛡️ {myCharacter.charName}</span>
                              {/* Player HP */}
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#ef4444', fontWeight: '750', marginBottom: '2px' }}>
                                  <span>HP</span>
                                  <span>{dungeonSession.playerHp} / {dungeonSession.playerMaxHp}</span>
                                </div>
                                <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${(dungeonSession.playerHp / dungeonSession.playerMaxHp) * 100}%`, height: '100%', background: '#ef4444' }} />
                                </div>
                              </div>
                              {/* Player MP */}
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#3b82f6', fontWeight: '750', marginBottom: '2px' }}>
                                  <span>MP</span>
                                  <span>{dungeonSession.playerMana} / {dungeonSession.playerMaxMana}</span>
                                </div>
                                <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${(dungeonSession.playerMana / dungeonSession.playerMaxMana) * 100}%`, height: '100%', background: '#3b82f6' }} />
                                </div>
                              </div>
                            </div>

                            {/* VS Emblem */}
                            <div style={{ fontSize: '16px', fontWeight: '900', color: '#ec4899', textShadow: '0 0 8px rgba(236,72,153,0.4)', padding: '4px' }}>VS</div>

                            {/* Monster Side */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right' }}>
                              <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#ffffff', display: 'block' }}>
                                {dungeonSession.monsterName} {dungeonSession.dungeonId === 'goblin' ? '👺' : dungeonSession.dungeonId === 'mines' ? '🤖' : '🔥'}
                              </span>
                              {/* Monster HP */}
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#f87171', fontWeight: '750', marginBottom: '2px', flexDirection: 'row-reverse' }}>
                                  <span>HP</span>
                                  <span>{dungeonSession.monsterHp} / {dungeonSession.monsterMaxHp}</span>
                                </div>
                                <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${(dungeonSession.monsterHp / dungeonSession.monsterMaxHp) * 100}%`, height: '100%', background: '#ef4444', float: 'right' }} />
                                </div>
                              </div>
                              <span style={{ fontSize: '9px', color: '#cbd5e1', fontStyle: 'italic', display: 'block', marginTop: '2px' }}>Damage: {dungeonSession.monsterDmg} DMG</span>
                            </div>
                          </div>
                        )}

                        {/* Scrolling Battle Feed log */}
                        <div className="combat-feed-terminal" style={{ background: '#020617', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', height: '180px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '11.5px', color: '#a7f3d0', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                          {combatLog || '⚔️ Connecting weapons and spells...'}
                        </div>

                        {/* Turn-based Action Buttons (Hide if combat finished) */}
                        {dungeonSession && !dungeonSession.finished && !combatResult && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '4px' }}>
                            <button
                              onClick={() => handleDungeonTurn('strike')}
                              disabled={isCombatLoading || dungeonSession.playerHp <= 0}
                              style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                            >
                              <span>⚔️ Strike</span>
                              <span style={{ fontSize: '9px', opacity: 0.8 }}>No Mana cost</span>
                            </button>
                            <button
                              onClick={() => handleDungeonTurn('spell')}
                              disabled={isCombatLoading || dungeonSession.playerHp <= 0 || dungeonSession.playerMana < 15}
                              style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                            >
                              <span>🔮 Cast Spell</span>
                              <span style={{ fontSize: '9px', opacity: 0.8 }}>Costs 15 Mana</span>
                            </button>
                            <button
                              onClick={() => handleDungeonTurn('defend')}
                              disabled={isCombatLoading || dungeonSession.playerHp <= 0}
                              style={{ background: '#4b5563', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                            >
                              <span>🛡️ Defend</span>
                              <span style={{ fontSize: '9px', opacity: 0.8 }}>Block 50% DMG</span>
                            </button>
                          </div>
                        )}

                        {/* Final summary box */}
                        {combatResult && (
                          <div style={{ padding: '14px', background: combatResult.status === 'victory' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: combatResult.status === 'victory' ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: combatResult.status === 'victory' ? '#34d399' : '#f87171' }}>
                              {combatResult.status === 'victory' ? '🏆 VICTORY ACHIEVED!' : '💀 DEFEATED IN COMBAT'}
                            </h5>
                            <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>
                              {combatResult.status === 'victory' ? `Earned +${combatResult.xpEarned} XP and harvested rare loot: ${combatResult.loot?.join(', ')}.` : 'You were knocked unconscious. Recovered in town with 5 HP remaining.'}
                            </p>
                            <button
                              onClick={() => { setCombatActive(false); setCombatResult(null); setCombatLog(''); setDungeonSession(null); }}
                              style={{ background: 'rgba(255,255,255,0.05)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', marginTop: '4px' }}
                            >
                              Exit Combat Arena
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GUILD HALL & WAR ROOM */}
            {activeTab === 'guild' && loggedInUser && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 1. ACTIVE CO-OP BOSS RAID WAR ROOM */}
                {activeRaid && activeRaid.active ? (
                  <div className="glass-card glow-pink" style={{ borderLeft: '4px solid #ec4899' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }} className="text-gradient-purple">🐉 ACTIVE GUILD BOSS RAID: {activeRaid.bossName}</h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>Cooperative Boss Combat. Coordinate with your clan members in real-time!</p>
                      </div>
                      <span className="live-badge" style={{ animation: 'pulse-glow 1s infinite' }}>LIVE COMBAT</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                      {/* Left: Combat stats & buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Boss HP Bar */}
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800', color: '#f87171', marginBottom: '6px' }}>
                            <span>{activeRaid.bossName?.toUpperCase()}</span>
                            <span>{activeRaid.bossHp?.toLocaleString()} / {activeRaid.bossMaxHp?.toLocaleString()} HP</span>
                          </div>
                          <div className="raid-bar" style={{ height: '16px' }}>
                            <div className="raid-bar-fill" style={{ width: `${Math.max(0, (activeRaid.bossHp / activeRaid.bossMaxHp) * 100)}%`, background: 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)' }} />
                          </div>
                        </div>

                        {/* Scrolling Live Feed */}
                        <div style={{ background: '#020617', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', height: '120px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '11.5px', color: '#fca5a5', lineHeight: '1.5' }}>
                          {activeRaid.logFeed || '⚔️ The battle begins! Coordinate your attacks.'}
                        </div>

                        {/* Interactive Actions (Enabled only if it's the user's turn) */}
                        {activeRaid.party?.some(p => p.userId === loggedInUser) ? (
                          (() => {
                            const isMyTurn = activeRaid.party[activeRaid.activeIdx]?.userId === loggedInUser;
                            const myCombatChar = activeRaid.party?.find(p => p.userId === loggedInUser);
                            
                            return (
                              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '16px', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: '750', color: isMyTurn ? '#a855f7' : '#94a3b8' }}>
                                    {isMyTurn ? '🌟 IT IS YOUR TURN! Take action now:' : `⏳ Turn: @${activeRaid.party[activeRaid.activeIdx]?.username || 'Waiting...'}`}
                                  </span>
                                  {myCombatChar && (
                                    <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                                      Your status: ❤️ {myCombatChar.hp}/{myCombatChar.maxHp} HP | 🌀 {myCombatChar.mana}/{myCombatChar.maxMana} MP
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                  <button
                                    onClick={() => handleRaidAction('attack')}
                                    disabled={!isMyTurn || (myCombatChar && myCombatChar.hp <= 0)}
                                    className="raid-combat-btn strike"
                                  >
                                    Strike ⚔️
                                  </button>
                                  <button
                                    onClick={() => handleRaidAction('spell')}
                                    disabled={!isMyTurn || (myCombatChar && (myCombatChar.hp <= 0 || myCombatChar.mana < 15))}
                                    className="raid-combat-btn spell"
                                  >
                                    Spell 🔮 (15 MP)
                                  </button>
                                  <button
                                    onClick={() => handleRaidAction('defend')}
                                    disabled={!isMyTurn || (myCombatChar && myCombatChar.hp <= 0)}
                                    className="raid-combat-btn defend"
                                  >
                                    Defend 🛡️
                                  </button>
                                  <button
                                    onClick={() => handleRaidAction('heal')}
                                    disabled={!isMyTurn || (myCombatChar && (myCombatChar.hp <= 0 || myCombatChar.mana < 20))}
                                    className="raid-combat-btn heal"
                                  >
                                    Group Heal 💚 (20 MP)
                                  </button>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
                            ℹ️ You are not a participant in this boss raid lobby. You can start or join raids on Discord.
                          </div>
                        )}
                      </div>

                      {/* Right: Party status logs list */}
                      <div>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Raid Party Vitals ({activeRaid.party?.length || 0})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {activeRaid.party?.map((p, idx) => {
                            const isCurrent = idx === activeRaid.activeIdx;
                            const hpPct = (p.hp / p.maxHp) * 100;
                            return (
                              <div key={p.userId} style={{ padding: '10px 14px', background: isCurrent ? 'rgba(236,72,153,0.08)' : 'rgba(15,23,42,0.6)', border: isCurrent ? '1px solid #ec4899' : '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '12.5px', fontWeight: '800', color: p.hp <= 0 ? '#ef4444' : '#ffffff' }}>
                                    {p.username} {p.hp <= 0 && '💀'}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '700' }}>Dmg: {p.dmgDealt}</span>
                                </div>
                                <div className="raid-bar" style={{ height: '6px' }}>
                                  <div className="raid-bar-fill" style={{ width: `${hpPct}%`, background: p.hp <= 0 ? '#ef4444' : hpPct > 50 ? '#10b981' : hpPct > 20 ? '#f59e0b' : '#ef4444' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8' }}>
                                  <span>HP: {p.hp}/{p.maxHp}</span>
                                  <span>Mana: {p.mana}/{p.maxMana}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* 2. MAIN GUILD HALL INFORMATION */}
                {myGuild && myGuild.inGuild ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                      {/* Left Card: Guild details, Treasury, Perks */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Title Crest */}
                        <div className="glass-card glow-violet" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                          <div style={{ fontSize: '48px' }}>🛡️</div>
                          <div style={{ flex: 1 }}>
                            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>{myGuild.guild.name}</h2>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#a855f7', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '1px' }}>
                              Guild Level {myGuild.guild.level} Clan
                            </p>
                            <div style={{ marginTop: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#cbd5e1', marginBottom: '4px' }}>
                                <span>Guild XP Progress</span>
                                <span>{myGuild.guild.xp} XP / {myGuild.guild.level * 500} XP</span>
                              </div>
                              <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${(myGuild.guild.xp / (myGuild.guild.level * 500)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #a855f7 0%, #d8b4fe 100%)' }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Treasury */}
                        <div className="glass-card glow-amber">
                          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#fbbf24' }}>💰 Guild Treasury Vault</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: '700' }}>TOTAL BANK FUNDS</span>
                              <h4 style={{ margin: '6px 0 0 0', fontSize: '26px', fontWeight: '850', color: '#fbbf24' }}>
                                🍒 {myGuild.guild.bankCoins?.toLocaleString()}
                              </h4>
                            </div>

                            <form onSubmit={handleDepositGuildCoins} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <label style={{ fontSize: '11px', color: '#94a3b8' }}>Deposit Wallet Cherries</label>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                  type="number"
                                  placeholder="Amount"
                                  value={guildDepositInput}
                                  onChange={(e) => setGuildDepositInput(Math.max(1, parseInt(e.target.value) || 0))}
                                  style={{ flex: 1, padding: '8px', background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '6px' }}
                                />
                                <button type="submit" style={{ background: '#fbbf24', color: '#000000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>
                                  Deposit
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>

                        {/* Guild Perks Board */}
                        <div className="glass-card">
                          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>⚡ Active Guild Perks Board</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {/* Perk 1: XP Boost */}
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#a855f7' }}>XP Multiplier Perk</span>
                                <span style={{ fontSize: '11.5px', background: 'rgba(168,85,247,0.1)', color: '#a855f7', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                                  Lvl {myGuild.guild.perkXpBoost}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Increases XP earned by +{(myGuild.guild.perkXpBoost * 5)}% in all guild activities.</p>
                              {myGuild.guild.ownerId === loggedInUser && (
                                <button
                                  onClick={() => handleUpgradeGuildPerk('xp_boost')}
                                  disabled={myGuild.guild.bankCoins < (myGuild.guild.perkXpBoost + 1) * 2000}
                                  style={{ background: 'rgba(139,92,246,0.15)', color: '#c084fc', border: '1px solid rgba(139,92,246,0.3)', padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '750', cursor: 'pointer', marginTop: '4px' }}
                                >
                                  Upgrade (🍒 {((myGuild.guild.perkXpBoost + 1) * 2000).toLocaleString()})
                                </button>
                              )}
                            </div>

                            {/* Perk 2: Shop Discount */}
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#10b981' }}>Boutique Shop Discount</span>
                                <span style={{ fontSize: '11.5px', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                                  Lvl {myGuild.guild.perkShopDiscount}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Reduces purchase prices in the web shop by -{Math.min(25, myGuild.guild.perkShopDiscount * 2)}%.</p>
                              {myGuild.guild.ownerId === loggedInUser && (
                                <button
                                  onClick={() => handleUpgradeGuildPerk('shop_discount')}
                                  disabled={myGuild.guild.bankCoins < (myGuild.guild.perkShopDiscount + 1) * 2000}
                                  style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '750', cursor: 'pointer', marginTop: '4px' }}
                                >
                                  Upgrade (🍒 {((myGuild.guild.perkShopDiscount + 1) * 2000).toLocaleString()})
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Card: Guild members contribution list */}
                      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>👥 Clan Roster & Contributions</h3>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Adventurer Name</th>
                                <th>Clan Rank</th>
                                <th style={{ textAlign: 'right' }}>Deposited Coins</th>
                              </tr>
                            </thead>
                            <tbody>
                              {myGuild.members?.map(m => (
                                <tr key={m.userId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                  <td style={{ fontWeight: '800' }}>
                                    {m.username} {m.userId === myGuild.guild.ownerId && '👑'}
                                  </td>
                                  <td>
                                    <span style={{ fontSize: '10px', background: m.role === 'Owner' ? 'rgba(236,72,153,0.15)' : 'rgba(255,255,255,0.05)', color: m.role === 'Owner' ? '#ec4899' : '#cbd5e1', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                      {m.role.toUpperCase()}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: '800', color: '#fbbf24' }}>
                                    🍒 {m.contribution?.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card glow-violet" style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                    <div style={{ fontSize: '64px' }}>🏰</div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>You Are Not in a Guild</h3>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
                      Guild Hall operations, treasury bank deposits, perk upgrades, and active Raid War Room participation are only available to guild members.
                    </p>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', width: '100%', boxSizing: 'border-box' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '750' }}>DISCORD SLASH COMMANDS:</span>
                      <code style={{ fontSize: '13px', color: '#c084fc', background: '#020617', padding: '6px 12px', borderRadius: '6px', display: 'block', fontFamily: 'monospace' }}>
                        /guild create [name]  |  /guild join [name]
                      </code>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PET CARE CENTER */}
            {activeTab === 'pets' && loggedInUser && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {myPet ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                    {/* Left: Pet Info & Interaction Belt */}
                    <div className="glass-card glow-violet" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ fontSize: '64px' }}>
                          {myPet.petType === 'Dog' ? '🐶' : myPet.petType === 'Cat' ? '🐱' : myPet.petType === 'Rabbit' ? '🐰' : '🦊'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>{myPet.petName}</h2>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#c084fc', fontWeight: '750', textTransform: 'uppercase' }}>
                            Level {myPet.level} {myPet.petType} companion
                          </p>
                          {/* Pet XP Progress Bar */}
                          <div style={{ marginTop: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#cbd5e1', marginBottom: '4px' }}>
                              <span>Pet Level Progress</span>
                              <span>{myPet.xp} XP / {myPet.level * 150} XP</span>
                            </div>
                            <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${(myPet.xp / (myPet.level * 150)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #c084fc 0%, #e879f9 100%)' }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stat Bars: Hunger & Affection */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', color: '#38bdf8', marginBottom: '6px' }}>
                            <span>🍴 SATIETY (HUNGER)</span>
                            <span>{myPet.hunger} / 100</span>
                          </div>
                          <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${myPet.hunger}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)' }} />
                          </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', color: '#ec4899', marginBottom: '6px' }}>
                            <span>❤️ AFFECTION</span>
                            <span>{myPet.affection} / 100</span>
                          </div>
                          <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${myPet.affection}%`, height: '100%', background: 'linear-gradient(90deg, #db2777 0%, #ec4899 100%)' }} />
                          </div>
                        </div>
                      </div>

                      {/* Interactive Belt */}
                      <div style={{ marginTop: '12px' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>🎾 Interactions & Care Belt</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <button
                            onClick={() => handlePlayPet()}
                            disabled={myCharacter.mana < 15 || myPet.hunger <= 10}
                            style={{ background: 'rgba(139,92,246,0.15)', color: '#c084fc', border: '1px solid rgba(139,92,246,0.3)', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                          >
                            <span style={{ fontSize: '18px' }}>🎾</span>
                            <span style={{ fontSize: '12px', fontWeight: '800' }}>Play with Pet</span>
                            <span style={{ fontSize: '9.5px', color: '#cbd5e1' }}>Consumes 15 Mana • Affection +20</span>
                          </button>

                          <button
                            onClick={() => handleTrainPet()}
                            disabled={(myCharacter.coins || 0) < 150}
                            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                          >
                            <span style={{ fontSize: '18px' }}>⚔️</span>
                            <span style={{ fontSize: '12px', fontWeight: '800' }}>Train Skills</span>
                            <span style={{ fontSize: '9.5px', color: '#cbd5e1' }}>Consumes 150 🍒 • XP +50</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right: Pantry / Food Stockpile & Wild Forest Expedition */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>🍎 Pet Pantry Stockpile</h3>
                        <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>Feed food harvested from your homestead farm plots to keep your pet satisfied.</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {/* Apples */}
                          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontWeight: '800', fontSize: '13px', display: 'block', color: '#ffffff' }}>Red Apples 🍎</span>
                              <span style={{ fontSize: '10px', color: '#cbd5e1' }}>Pantry Qty: x{myInventory.find(i => i.itemName === 'Apple')?.quantity || 0}</span>
                            </div>
                            <button
                              onClick={() => handleFeedPet('Apple')}
                              disabled={(myInventory.find(i => i.itemName === 'Apple')?.quantity || 0) <= 0 || myPet.hunger >= 100}
                              style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}
                            >
                              Feed Apple
                            </button>
                          </div>

                          {/* Berries */}
                          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontWeight: '800', fontSize: '13px', display: 'block', color: '#ffffff' }}>Blue Berries 🫐</span>
                              <span style={{ fontSize: '10px', color: '#cbd5e1' }}>Pantry Qty: x{myInventory.find(i => i.itemName === 'Berry')?.quantity || 0}</span>
                            </div>
                            <button
                              onClick={() => handleFeedPet('Berry')}
                              disabled={(myInventory.find(i => i.itemName === 'Berry')?.quantity || 0) <= 0 || myPet.hunger >= 100}
                              style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}
                            >
                              Feed Berry
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Wild Forest Expedition Card */}
                      <div className="glass-card glow-violet" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>🌲 Wild Forest Expedition</h3>
                        
                        {myPet.status === 'Idle' && (
                          <>
                            <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: '1.5' }}>
                              Send your companion into the forest to scavenge for seeds, raw meats, and materials.
                            </p>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', fontSize: '10.5px', color: '#cbd5e1' }}>
                              <span>📋 **Requirements:**</span>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                <span>• Duration:</span>
                                <span style={{ fontWeight: '800', color: '#a855f7' }}>1 Minute</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                                <span>• Fullness Cost:</span>
                                <span style={{ fontWeight: '800', color: myPet.hunger < 20 ? '#ef4444' : '#10b981' }}>20 Fullness (Current: {myPet.hunger}%)</span>
                              </div>
                            </div>
                            <button
                              onClick={handleStartPetAdventure}
                              disabled={myPet.hunger < 20}
                              style={{
                                width: '100%',
                                background: myPet.hunger < 20 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                                color: myPet.hunger < 20 ? '#64748b' : '#ffffff',
                                border: 'none',
                                padding: '10px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '800',
                                cursor: myPet.hunger < 20 ? 'not-allowed' : 'pointer',
                                boxShadow: myPet.hunger < 20 ? 'none' : '0 4px 10px rgba(168,85,247,0.25)'
                              }}
                            >
                              {myPet.hunger < 20 ? 'Fullness Too Low to Dispatch!' : 'Dispatch Companion'}
                            </button>
                          </>
                        )}

                        {myPet.status === 'Adventure' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center', padding: '8px 0' }}>
                            {petRemainingTime > 0 ? (
                              <>
                                <span style={{ fontSize: '32px', display: 'block' }}>🏃</span>
                                <div>
                                  <span style={{ fontSize: '12px', fontWeight: '800', display: 'block', color: '#ffffff' }}>Exploring the Wilds...</span>
                                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Gathering materials & dodging monsters</span>
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: '850', color: '#c084fc', fontFamily: 'monospace' }}>
                                  ⏰ {Math.floor(petRemainingTime / 60)}:{(petRemainingTime % 60).toString().padStart(2, '0')}
                                </div>
                                <div className="raid-bar" style={{ height: '8px', marginTop: '4px' }}>
                                  <div className="raid-bar-fill" style={{ width: `${((60 - petRemainingTime) / 60) * 100}%`, background: 'linear-gradient(90deg, #c084fc 0%, #e879f9 100%)' }} />
                                </div>
                              </>
                            ) : (
                              <>
                                <span style={{ fontSize: '32px', display: 'block' }}>🎁</span>
                                <div>
                                  <span style={{ fontSize: '13px', fontWeight: '800', display: 'block', color: '#10b981' }}>Expedition Completed!</span>
                                  <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Your companion has returned with full bags.</span>
                                </div>
                                <button
                                  onClick={handleClaimPetAdventure}
                                  style={{
                                    width: '100%',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 10px rgba(16,185,129,0.25)',
                                    marginTop: '6px'
                                  }}
                                >
                                  Claim Loot & Rewards
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Claim Results Banner */}
                        {petAdventureResult && (
                          <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', fontWeight: '800', color: '#34d399' }}>🎉 Expedition Rewards!</span>
                              <button
                                onClick={() => setPetAdventureResult(null)}
                                style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                ✕
                              </button>
                            </div>
                            <div style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span>• Companion XP: **+{petAdventureResult.xpGained} XP** {petAdventureResult.leveledUp && <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>🌟 LEVEL UP! (Lvl {petAdventureResult.newLevel})</span>}</span>
                              <span>• Items Scavenged:</span>
                              <div style={{ paddingLeft: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                                {petAdventureResult.loot?.map((l, i) => (
                                  <span key={i} style={{ background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    {l.name} (x{l.qty})
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card glow-violet" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                    <div style={{ fontSize: '64px' }}>🦊</div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Adopt Your RPG Companion</h3>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
                      You don't own an RPG pet yet! Adopt one here to accompany you on your dungeons quests and earn extra training passive rewards.
                    </p>
                    <form onSubmit={handleAdoptPet} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <select
                          value={adoptPetType}
                          onChange={(e) => setAdoptPetType(e.target.value)}
                          style={{ padding: '8px', background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '6px', width: '100px' }}
                        >
                          <option value="Dog">Dog 🐶</option>
                          <option value="Cat">Cat 🐱</option>
                          <option value="Rabbit">Rabbit 🐰</option>
                          <option value="Fox">Fox 🦊</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Pet Name"
                          value={adoptPetName}
                          onChange={(e) => setAdoptPetName(e.target.value)}
                          style={{ flex: 1, padding: '8px', background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '6px' }}
                        />
                      </div>
                      <button type="submit" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #d8b4fe 100%)', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' }}>
                        Adopt Companion
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* TAB: BUSINESS TYCOON */}
            {activeTab === 'business' && loggedInUser && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>🏢 Business Simulator Tycoon</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>Invest in local shops to accumulate passive cherry outputs hourly.</p>
                  </div>
                  <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px', color: '#cbd5e1' }}>
                    Available Capital: <strong style={{ color: '#fbbf24' }}>🍒 {(myCharacter.coins || 0).toLocaleString()}</strong>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  {[
                    { id: 'Tavern', icon: '🍺', baseCost: 5000, rate: 150, desc: 'A rustic local tavern providing refreshments to adventurers.' },
                    { id: 'Blacksmith', icon: '⚒️', baseCost: 12000, rate: 350, desc: 'Forges iron armors and steel weaponry to boost production.' },
                    { id: 'Apothecary', icon: '🧪', baseCost: 25000, rate: 800, desc: 'Brew magical status potions and health restoration vials.' }
                  ].map(bizConfig => {
                    const biz = myBusinesses.find(b => b.businessType === bizConfig.id);
                    const isOwned = !!biz;
                    
                    let uncollected = 0;
                    if (isOwned) {
                      const elapsedHours = (Date.now() - biz.lastCollected) / (3600 * 1000);
                      uncollected = Math.max(0, Math.floor(elapsedHours * bizConfig.rate * biz.level));
                    }

                    return (
                      <div key={bizConfig.id} className={`glass-card ${isOwned ? 'glow-amber' : ''}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '32px' }}>{bizConfig.icon}</span>
                            {isOwned ? (
                              <span style={{ fontSize: '11px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', padding: '2px 8px', borderRadius: '20px', fontWeight: '800' }}>
                                Lvl {biz.level} Owned
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '2px 8px', borderRadius: '20px', fontWeight: '800' }}>
                                Not Owned
                              </span>
                            )}
                          </div>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>{bizConfig.id}</h4>
                          <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>{bizConfig.desc}</p>
                        </div>

                        {isOwned ? (
                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#cbd5e1' }}>
                              <span>Output Rate:</span>
                              <strong style={{ color: '#fbbf24' }}>🍒 {(bizConfig.rate * biz.level)} / hour</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#cbd5e1', alignItems: 'center' }}>
                              <span>Accrued Vault:</span>
                              <strong style={{ color: '#34d399', fontSize: '13px' }}>🍒 {uncollected.toLocaleString()}</strong>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                              <button
                                onClick={() => handleCollectBusinessRevenue(bizConfig.id)}
                                disabled={uncollected <= 0}
                                style={{ flex: 1, background: '#34d399', color: '#000000', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                              >
                                Claim
                              </button>
                              <button
                                onClick={() => handleUpgradeBusiness(bizConfig.id)}
                                disabled={(myCharacter.coins || 0) < biz.level * 5000}
                                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                              >
                                Lvl Up (🍒 {(biz.level * 5000).toLocaleString()})
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#cbd5e1' }}>
                              <span>Base Revenue Rate:</span>
                              <strong>🍒 {bizConfig.rate} / hour</strong>
                            </div>
                            <button
                              onClick={() => handleBuyBusiness(bizConfig.id)}
                              disabled={(myCharacter.coins || 0) < bizConfig.baseCost}
                              style={{ width: '100%', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: '#000000', border: 'none', padding: '10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', marginTop: '4px' }}
                            >
                              Acquire (🍒 {bizConfig.baseCost.toLocaleString()})
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: LOGISTICS & DELIVERY */}
            {activeTab === 'delivery' && loggedInUser && deliveryCompany && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
                {/* Left Column: Fleet upgrades & automated passives */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="glass-card glow-violet" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>🚚 Logistics Dispatch Fleet Depot</h3>
                    
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '36px' }}>
                        {deliveryCompany.vehicle === 'Bicycle' ? '🚲' : deliveryCompany.vehicle === 'Motorcycle' ? '🏍️' : '🚚'}
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: '700' }}>FLEET TRANSPORT</span>
                        <strong style={{ fontSize: '15px', color: '#ffffff' }}>{deliveryCompany.vehicle} Transport</strong>
                        <span style={{ fontSize: '9.5px', color: '#cbd5e1', display: 'block', marginTop: '2px' }}>
                          Allows {deliveryCompany.vehicle === 'Bicycle' ? '1 active run' : deliveryCompany.vehicle === 'Motorcycle' ? '2 parallel active runs' : '3 parallel active runs'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {deliveryCompany.vehicle !== 'Delivery Truck' ? (
                        <button
                          onClick={() => handleUpgradeVehicle()}
                          disabled={(myCharacter.coins || 0) < (deliveryCompany.vehicle === 'Bicycle' ? 3000 : 10000)}
                          style={{ width: '100%', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc', padding: '10px', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', fontSize: '11.5px' }}
                        >
                          Upgrade Transport Fleet (🍒 {deliveryCompany.vehicle === 'Bicycle' ? '3,000' : '10,000'})
                        </button>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(16,185,129,0.06)', borderRadius: '6px', fontSize: '11px', color: '#34d399', fontWeight: '750' }}>
                          ✓ Maximum vehicle tier transport achieved
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>Hired Dispatchers</span>
                          <strong style={{ fontSize: '15px', color: '#ffffff' }}>{deliveryCompany.workers} Crew</strong>
                        </div>
                        <button
                          onClick={() => handleHireWorker()}
                          disabled={(myCharacter.coins || 0) < 2000}
                          style={{ flex: 1.2, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', padding: '10px', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', fontSize: '11.5px' }}
                        >
                          Hire Driver (🍒 2,000)
                        </button>
                      </div>
                    </div>
                  </div>

                  {deliveryCompany.workers > 0 && (
                    <div className="glass-card glow-amber">
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '13.5px', fontWeight: '800', color: '#fbbf24' }}>💰 Automated Passive Dispatch</h4>
                      <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>Passive cargo drivers collect coins automatically in the background.</p>
                      
                      {(() => {
                        const elapsedHours = (Date.now() - deliveryCompany.lastAutomatedClaim) / (3600 * 1000);
                        const passiveAccrued = Math.max(0, Math.floor(elapsedHours * deliveryCompany.workers * 50));
                        
                        return (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '8px' }}>
                            <div>
                              <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>ACCRUED PASSIVE</span>
                              <strong style={{ fontSize: '16px', color: '#34d399' }}>🍒 {passiveAccrued.toLocaleString()}</strong>
                            </div>
                            <button
                              onClick={() => handleCollectPassiveEarnings()}
                              disabled={passiveAccrued <= 0}
                              style={{ background: '#fbbf24', color: '#000000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}
                            >
                              Collect Passive
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Right Column: Dispatch board & jobs lists */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>📋 Active Cargo Dispatch Board</h3>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '750' }}>
                        Capacity: {deliveryJobs.length} / {deliveryCompany.vehicle === 'Bicycle' ? 1 : deliveryCompany.vehicle === 'Motorcycle' ? 2 : 3}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      {[
                        { name: 'Produce Run', time: '2 Min', pay: 250, desc: 'Deliver local organic veggies to town markets.' },
                        { name: 'Express Run', time: '5 Min', pay: 700, desc: 'Express shipping parcel mail across cities.' },
                        { name: 'Cross-Country Haul', time: '15 Min', pay: 2500, desc: 'Long distance heavy industrial cargo transport.' }
                      ].map(job => {
                        const maxParallel = deliveryCompany.vehicle === 'Bicycle' ? 1 : deliveryCompany.vehicle === 'Motorcycle' ? 2 : 3;
                        const isAtCapacity = deliveryJobs.length >= maxParallel;
                        
                        return (
                          <div key={job.name} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <strong style={{ fontSize: '12.5px', color: '#ffffff' }}>{job.name}</strong>
                              <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>⏱️ {job.time} • Reward: <strong style={{ color: '#fbbf24' }}>🍒 {job.pay}</strong></span>
                            </div>
                            <button
                              onClick={() => handleStartDeliveryJob(job.name)}
                              disabled={isAtCapacity}
                              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                            >
                              Dispatch
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {deliveryJobs.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Transit Cargo Runs ({deliveryJobs.length})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {deliveryJobs.map(job => {
                          const remainingMs = job.endsAt - Date.now();
                          const isDone = remainingMs <= 0;
                          const totalDuration = job.jobName === 'Produce Run' ? 120000 : job.jobName === 'Express Run' ? 300000 : 900000;
                          const progressPct = isDone ? 100 : Math.max(0, Math.min(100, ((totalDuration - remainingMs) / totalDuration) * 100));

                          return (
                            <div key={job.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '12px', color: '#cbd5e1' }}>{job.jobName}</strong>
                                {isDone ? (
                                  <span style={{ fontSize: '10px', color: '#34d399', fontWeight: '800' }}>ARRIVED 🏁</span>
) : (
                              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Transit... {Math.ceil(remainingMs / 1000)}s</span>
                            )}
                          </div>
                          <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: `${progressPct}%`, height: '100%', background: isDone ? '#10b981' : '#3b82f6', transition: 'width 0.5s linear' }} />
                          </div>
                          
                          {isDone && (
                            <button
                              onClick={() => handleClaimDeliveryJob(job.id)}
                              style={{ width: '100%', background: '#10b981', color: '#000000', border: 'none', padding: '6px', borderRadius: '4px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', marginTop: '10px' }}
                            >
                              Claim Payout (🍒 {job.payout})
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: DINOSAUR ZOO PARK */}
        {activeTab === 'dinopark' && loggedInUser && dinoPark && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            {/* Left Card: Dino exhibits, incubator, security controls */}
            <div className="glass-card glow-violet" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ fontSize: '56px' }}>🦖</div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Prehistoric Dinosaur Zoo</h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#c084fc', fontWeight: '750', textTransform: 'uppercase' }}>
                    Security Grid Status: Lvl {dinoPark.securityLevel}
                  </p>
                </div>
              </div>

              {/* Incubator panel */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>🥚 Bio-Gene Cloning Incubator</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block' }}>Next Clone Cost:</span>
                    <strong style={{ fontSize: '15px', color: '#fbbf24' }}>🍒 {((dinoPark.dinos + 1) * 3000).toLocaleString()}</strong>
                  </div>
                  <button
                    onClick={handleCloneDinosaur}
                    disabled={(myCharacter.coins || 0) < (dinoPark.dinos + 1) * 3000}
                    style={{ background: 'linear-gradient(135deg, #a855f7 0%, #d8b4fe 100%)', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Hatch Dinosaur
                  </button>
                </div>
              </div>

              {/* Security upgrade panel */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>⚡ Electrified Containment Grid</h3>
                <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#cbd5e1' }}>Upgrading grid security levels multiplies visitor ticket payouts and prevents escapes.</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block' }}>Upgrade Cost:</span>
                    <strong style={{ fontSize: '15px', color: '#fbbf24' }}>🍒 {(dinoPark.securityLevel * 4000).toLocaleString()}</strong>
                  </div>
                  <button
                    onClick={handleUpgradeSecurity}
                    disabled={(myCharacter.coins || 0) < dinoPark.securityLevel * 4000}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', padding: '10px 20px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Upgrade Grid
                  </button>
                </div>
              </div>
            </div>

            {/* Right Card: Zoo population and revenues */}
            <div className="glass-card glow-amber" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#fbbf24' }}>🎫 Dinosaur Zoo Visitors & Payouts</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>DINOSAUR COUNT</span>
                  <strong style={{ fontSize: '20px', color: '#ffffff' }}>{dinoPark.dinos} dinos</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>HOURLY VISITORS RATE</span>
                  <strong style={{ fontSize: '20px', color: '#fbbf24' }}>🍒 {(dinoPark.dinos * 250 * dinoPark.securityLevel).toLocaleString()} / hr</strong>
                </div>
              </div>

              {(() => {
                const elapsedHours = (Date.now() - dinoPark.lastCollected) / (3600 * 1000);
                const accrued = Math.max(0, Math.floor(elapsedHours * dinoPark.dinos * 250 * dinoPark.securityLevel));
                
                return (
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#cbd5e1', display: 'block' }}>ACCRUED ZOO REVENUES</span>
                      <strong style={{ fontSize: '20px', color: '#34d399' }}>🍒 {accrued.toLocaleString()}</strong>
                    </div>
                    <button
                      onClick={handleCollectDinoRevenue}
                      disabled={accrued <= 0}
                      style={{ background: '#34d399', color: '#000000', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      Collect Tickets
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB: AQUARIUM MUSEUM */}
        {activeTab === 'aquarium' && loggedInUser && aquariumData && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            {/* Left: Interactive visual floating fish tank */}
            <div className="glass-card glow-violet" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🐠 Aquarium Exhibition Museum Tank</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>Watch your stocked species swim dynamically inside the exhibition pool.</p>
              </div>

              <div style={{ height: '240px', background: 'radial-gradient(circle, #0e7490 0%, #164e63 100%)', border: '2px solid rgba(56,189,248,0.3)', borderRadius: '12px', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)' }}>
                <div className="tank-bubble" style={{ left: '10%', bottom: '0', animationDelay: '0s' }} />
                <div className="tank-bubble" style={{ left: '40%', bottom: '0', animationDelay: '2s' }} />
                <div className="tank-bubble" style={{ left: '70%', bottom: '0', animationDelay: '1.5s' }} />
                <div className="tank-bubble" style={{ left: '90%', bottom: '0', animationDelay: '3.3s' }} />

                {Array.from({ length: aquariumData.fishCount }).map((_, idx) => {
                  const fishEmojis = ['🐠', '🐡', '🐙', '🦑', '🐠', '🐬', '🐋', '🦈', '🦐', '🦀'];
                  const emoji = fishEmojis[idx % fishEmojis.length];
                  const delay = (idx * 1.8) % 8;
                  const duration = 12 + ((idx * 5) % 10);
                  const top = 15 + ((idx * 24) % 70);

                  return (
                    <div
                      key={idx}
                      className="swimming-fish"
                      style={{
                        top: `${top}%`,
                        animationDelay: `${delay}s`,
                        animationDuration: `${duration}s`,
                        fontSize: '24px'
                      }}
                    >
                      {emoji}
                    </div>
                  );
                })}

                {aquariumData.fishCount === 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', fontSize: '13px' }}>
                    This exhibition tank is currently vacant. Stock some fish species!
                  </div>
                )}
              </div>
            </div>

            {/* Right: Buy fish & collect tourist revenue */}
            <div className="glass-card glow-amber" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#fbbf24' }}>🐠 Stocking & Tourist Payouts</h3>
              
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block' }}>Exhibition Species:</span>
                    <strong style={{ fontSize: '18px', color: '#ffffff' }}>{aquariumData.fishCount} fish stocked</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block' }}>Output multiplier:</span>
                    <strong style={{ fontSize: '18px', color: '#fbbf24' }}>🍒 {(aquariumData.fishCount * 60)} / hr</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block' }}>Next Fish Cost:</span>
                    <strong style={{ fontSize: '14px', color: '#fbbf24' }}>🍒 {((aquariumData.fishCount + 1) * 1000).toLocaleString()}</strong>
                  </div>
                  <button
                    onClick={handleBuyFish}
                    disabled={(myCharacter.coins || 0) < (aquariumData.fishCount + 1) * 1000}
                    style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Buy Fish
                  </button>
                </div>
              </div>

              {(() => {
                const elapsedHours = (Date.now() - aquariumData.lastCollected) / (3600 * 1000);
                const accrued = Math.max(0, Math.floor(elapsedHours * aquariumData.fishCount * 60));
                
                return (
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#cbd5e1', display: 'block' }}>ACCRUED TOURIST REVENUES</span>
                      <strong style={{ fontSize: '20px', color: '#34d399' }}>🍒 {accrued.toLocaleString()}</strong>
                    </div>
                    <button
                      onClick={handleCollectAquariumRevenue}
                      disabled={accrued <= 0}
                      style={{ background: '#34d399', color: '#000000', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      Collect Tourist Fees
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB: CASINO & FUN */}
        {activeTab === 'casino' && loggedInUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Casino Sub Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              {[
                { id: 'wheel', name: '🎡 Wheel of Fortune & Lotto' },
                { id: 'slots', name: '🎰 Progressive Slots' },
                { id: 'blackjack', name: '🃏 Blackjack Table' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setCasinoSubTab(sub.id)}
                  className={casinoSubTab === sub.id ? 'nav-tab active' : 'nav-tab'}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  {sub.name}
                </button>
              ))}
            </div>

            {/* 1. Wheel of Fortune & Lottery */}
            {casinoSubTab === 'wheel' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🎡 Interactive Wheel of Fortune</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>Spin the wheel of fortune once daily or using cherries</p>
                  </div>

                  <div className="wheel-container">
                    <div className="wheel-pointer" />
                    <div 
                      className="wheel-circle" 
                      style={{ transform: `rotate(${wheelDegrees}deg)` }}
                    />
                    <div className="wheel-center-pin">🎡</div>
                  </div>

                  <div>
                    <button
                      onClick={handleSpinWheel}
                      disabled={isSpinning}
                      style={{ 
                        background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', 
                        color: '#000000', 
                        border: 'none', 
                        padding: '12px 32px', 
                        borderRadius: '12px', 
                        fontSize: '14px', 
                        fontWeight: '800', 
                        cursor: isSpinning ? 'not-allowed' : 'pointer', 
                        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                        opacity: isSpinning ? 0.6 : 1
                      }}
                    >
                      {isSpinning ? 'Spinning...' : 'Spin Wheel (🍒 200)'}
                    </button>
                    {spinResult && !isSpinning && (
                      <div style={{ marginTop: '16px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '750' }}>
                        🎉 Landed on: **{spinResult}**!
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="glass-card">
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '800' }}>🎟️ Progressive Lottery Center</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', marginBottom: '16px' }}>Wager on three numbers from 1 to 9. Matches win the jackpot pool!</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '10px', marginBottom: '20px' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: '#f59e0b', display: 'block', fontWeight: '750' }}>JACKPOT POOL</span>
                        <span style={{ fontSize: '20px', fontWeight: '850', color: '#ffffff' }}>🍒 {lotteryData.pool?.toLocaleString()} cherries</span>
                      </div>
                    </div>

                    <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '800', color: '#ffffff' }}>Choose Your Lucky Numbers (1 - 9)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                      {['n1', 'n2', 'n3'].map(k => (
                        <select
                          key={k}
                          value={lotteryNumbers[k]}
                          onChange={(e) => setLotteryNumbers({ ...lotteryNumbers, [k]: e.target.value })}
                          style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px', fontSize: '14px', fontWeight: '850', textAlign: 'center', cursor: 'pointer' }}
                        >
                          {[1,2,3,4,5,6,7,8,9].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      ))}
                    </div>

                    <button
                      onClick={handleBuyLotteryTicket}
                      style={{ width: '100%', background: '#be123c', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      Purchase Ticket (🍒 100)
                    </button>
                  </div>

                  <div className="glass-card">
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800' }}>🎟️ Your Purchased Tickets</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxHeight: '180px', overflowY: 'auto' }}>
                      {lotteryData.myTickets.map((t, idx) => (
                        <div key={idx} className="ticket-stub">
                          <span style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.8 }}>CHERRY LOTTO</span>
                          <div className="ticket-numbers">
                            <span className="ticket-number-bubble">{t.n1}</span>
                            <span className="ticket-number-bubble">{t.n2}</span>
                            <span className="ticket-number-bubble">{t.n3}</span>
                          </div>
                        </div>
                      ))}
                      {lotteryData.myTickets.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: '#64748b', fontStyle: 'italic' }}>
                          You have no active lottery tickets for the upcoming draw.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

                {/* 2. Progressive Slots */}
                {casinoSubTab === 'slots' && (
                  <div className="glass-card glow-amber" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>🎰 High-Roller Progressive Slots</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>Match all three reels to win the jackpot pool!</p>
                    </div>

                    <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: '850', letterSpacing: '1px' }}>PROGRESSIVE JACKPOT</span>
                      <strong style={{ fontSize: '32px', color: '#ffffff', textShadow: '0 0 10px rgba(251,191,36,0.3)' }}>
                        🍒 {slotsJackpotVal?.toLocaleString()}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', margin: '12px 0' }}>
                      {slotsSymbols.map((sym, idx) => (
                        <div key={idx} className={`slots-reel ${slotsSpinning ? 'spinning' : ''}`}>
                          {sym}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '750' }}>Wager Bet:</span>
                        <input
                          type="number"
                          value={slotsBetInput}
                          onChange={(e) => setSlotsBetInput(Math.max(1, parseInt(e.target.value) || 0))}
                          style={{ width: '100px', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px', fontSize: '14px', fontWeight: '850', textAlign: 'center' }}
                        />
                        <button
                          onClick={handleSlotsSpin}
                          disabled={slotsSpinning || (myCharacter?.coins || 0) < parseInt(slotsBetInput)}
                          style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: '#000000', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 10px rgba(251,191,36,0.3)' }}
                        >
                          {slotsSpinning ? 'Spinning...' : 'Pull Lever'}
                        </button>
                      </div>

                      {slotsResult && (
                        <div style={{
                          marginTop: '8px',
                          background: slotsResult.result === 'lose' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          border: `1px solid ${slotsResult.result === 'lose' ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
                          color: slotsResult.result === 'lose' ? '#f87171' : '#34d399',
                          padding: '12px 24px',
                          borderRadius: '10px',
                          fontWeight: '800',
                          fontSize: '13.5px'
                        }}>
                          {slotsResult.result === 'jackpot' ? `🏆 JACKPOT WINNER! Won 🍒 ${slotsResult.payout.toLocaleString()} cherries!` :
                           slotsResult.result === 'triple' ? `🔥 TRIPLE MATCH! Won 10x bet: 🍒 ${slotsResult.payout.toLocaleString()} cherries!` :
                           slotsResult.result === 'double' ? `✨ Double match! Won 2x bet: 🍒 ${slotsResult.payout.toLocaleString()} cherries!` :
                           '😢 No match. Better luck next spin!'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Blackjack Table */}
                {casinoSubTab === 'blackjack' && (
                  <div className="blackjack-table" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#ffffff' }}>♣️ Visual Blackjack Arena ♣️</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>Dealer must stand on 17 and draw on 16</p>
                      </div>
                      {bjState.active && (
                        <div style={{ fontSize: '13px', background: 'rgba(251, 191, 36, 0.2)', border: '1px solid #fbbf24', padding: '6px 12px', borderRadius: '8px', color: '#fbbf24', fontWeight: '800' }}>
                          Wager: 🍒 {bjState.bet} cherries
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '32px', alignItems: 'start' }}>
                      {/* Left: Dealer and Player hands */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="hand-panel">
                          <div className="hand-title">
                            <span>Dealer Hand</span>
                            <span>{bjState.active ? `Score: ${bjState.dealerVal}` : bjState.status ? `Final Score: ${bjState.dealerVal}` : ''}</span>
                          </div>
                          <div className="cards-list">
                            {bjState.active || bjState.status ? (
                              bjState.dealerHand.map((c, i) => (
                                <div key={i} className={`playing-card ${c.suit === '?' ? 'back' : ['♥', '♦'].includes(c.suit) ? 'red' : 'black'}`}>
                                  {c.suit === '?' ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontSize: '24px' }}>🎀</div>
                                  ) : (
                                    <>
                                      <span className="card-top-label">{c.value}</span>
                                      <span className="card-center-suit">{c.suit}</span>
                                      <span className="card-bottom-label">{c.value}</span>
                                    </>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '13px', opacity: 0.7 }}>Dealer cards will be dealt here.</div>
                            )}
                          </div>
                        </div>

                        <div className="hand-panel">
                          <div className="hand-title">
                            <span>Your Hand</span>
                            <span>{bjState.active || bjState.status ? `Score: ${bjState.playerVal}` : ''}</span>
                          </div>
                          <div className="cards-list">
                            {bjState.active || bjState.status ? (
                              bjState.playerHand.map((c, i) => (
                                <div key={i} className={`playing-card ${['♥', '♦'].includes(c.suit) ? 'red' : 'black'}`}>
                                  <span className="card-top-label">{c.value}</span>
                                  <span className="card-center-suit">{c.suit}</span>
                                  <span className="card-bottom-label">{c.value}</span>
                                </div>
                              ))
                            ) : (
                              <div style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '13px', opacity: 0.7 }}>Place a wager to deal card deck.</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: The Shoe / Deck visual & Game Info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', background: 'rgba(0, 0, 0, 0.25)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: '11px', color: '#a3e635', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>THE DECK SHOE</span>
                        
                        {/* Deck Visual Stack */}
                        <div style={{ position: 'relative', width: '80px', height: '120px', margin: '10px 0 20px 0' }}>
                          <div className="playing-card back" style={{ position: 'absolute', top: '0px', left: '0px', transform: 'rotate(-6deg)', margin: 0, pointerEvents: 'none' }}></div>
                          <div className="playing-card back" style={{ position: 'absolute', top: '-2px', left: '2px', transform: 'rotate(-3deg)', margin: 0, pointerEvents: 'none' }}></div>
                          <div className="playing-card back" style={{ position: 'absolute', top: '-4px', left: '4px', transform: 'rotate(0deg)', margin: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ fontSize: '24px', color: '#ffffff' }}>♣️</div>
                          </div>
                        </div>

                        <div style={{ fontSize: '11px', color: '#cbd5e1', width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Multiplier:</span>
                            <strong style={{ color: '#fbbf24' }}>3:2 Payout</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Soft 17:</span>
                            <strong style={{ color: '#a3e635' }}>Dealer Stands</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Deck Count:</span>
                            <strong style={{ color: '#ffffff' }}>6 Decks</strong>
                          </div>
                        </div>

                        {bjState.status && bjState.status !== 'playing' && (
                          <div style={{
                            width: '100%',
                            marginTop: '10px',
                            background: 
                              bjState.status === 'win' || bjState.status === 'natural_blackjack' ? 'rgba(16,185,129,0.15)' :
                              bjState.status === 'push' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                            border: `1px solid ${
                              bjState.status === 'win' || bjState.status === 'natural_blackjack' ? '#10b981' :
                              bjState.status === 'push' ? '#f59e0b' : '#ef4444'
                            }`,
                            color: 
                              bjState.status === 'win' || bjState.status === 'natural_blackjack' ? '#34d399' :
                              bjState.status === 'push' ? '#fbbf24' : '#f87171',
                            padding: '10px',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontWeight: '800',
                            fontSize: '11.5px',
                            textTransform: 'uppercase'
                          }}>
                            {bjState.status === 'win' ? '🎉 YOU WIN!' :
                             bjState.status === 'natural_blackjack' ? '💥 BLACKJACK!' :
                             bjState.status === 'push' ? '🤝 PUSH (TIE)' :
                             bjState.status === 'bust' ? '😢 BUSTED' :
                             '😢 DEALER WINS'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {!bjState.active ? (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: '750' }}>Wager Amount:</span>
                          <input
                            type="number"
                            value={bjWager}
                            onChange={(e) => setBjWager(Math.max(1, parseInt(e.target.value) || 0))}
                            style={{ width: '100px', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px', fontSize: '14px', fontWeight: '850', textAlign: 'center' }}
                          />
                          <button
                            onClick={handleBlackjackStart}
                            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}
                          >
                            Deal Hand
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={handleBlackjackHit}
                            style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Hit ➕
                          </button>
                          <button
                            onClick={handleBlackjackStand}
                            style={{ background: '#f59e0b', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Stand ✋
                          </button>
                          <button
                            onClick={handleBlackjackDouble}
                            style={{ background: '#a855f7', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Double Down ✖️2
                          </button>
                        </div>
                      )}

                      {bjState.status && !bjState.active && (
                        <div style={{ 
                          background: bjState.status === 'win' || bjState.status === 'dealer_bust' || bjState.status === 'natural_blackjack' ? 'rgba(16, 185, 129, 0.2)' : bjState.status === 'push' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          border: `1px solid ${bjState.status === 'win' || bjState.status === 'dealer_bust' || bjState.status === 'natural_blackjack' ? '#10b981' : bjState.status === 'push' ? '#f59e0b' : '#ef4444'}`,
                          color: bjState.status === 'win' || bjState.status === 'dealer_bust' || bjState.status === 'natural_blackjack' ? '#34d399' : bjState.status === 'push' ? '#fbbf24' : '#f87171',
                          padding: '10px 20px',
                          borderRadius: '10px',
                          fontWeight: '800',
                          fontSize: '14px'
                        }}>
                          {bjState.status === 'natural_blackjack' ? 'NATURAL BLACKJACK!' :
                           bjState.status === 'win' ? 'YOU WIN!' :
                           bjState.status === 'dealer_bust' ? 'DEALER BUST! YOU WIN!' :
                           bjState.status === 'loss' ? 'DEALER WINS!' :
                           bjState.status === 'bust' ? 'BUST! DEALER WINS!' :
                           'PUSH / TIE!'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: AI OPERATIONS HUB */}
            {activeTab === 'ai_hub' && loggedInUser && (
              <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px' }}>
                
                {/* Left Sidebar: Tool Selector */}
                <div className="glass-card glow-violet" style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: 'fit-content' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '850', color: '#c084fc', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>🤖 AI Operations Hub</h3>
                  {[
                    { id: 'chat', name: '💬 Chatbot & Assistant' },
                    { id: 'moderate', name: '🛡️ Moderation & Safety' },
                    { id: 'summarize', name: '📝 Summarizer Tool' },
                    { id: 'translate', name: '🌐 Translation & Grammar' },
                    { id: 'starter', name: '🎲 Conversation Starters' }
                  ].map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => setAiHubTab(tool.id)}
                      className={aiHubTab === tool.id ? 'nav-tab active' : 'nav-tab'}
                      style={{ fontSize: '12px', padding: '10px 14px', textAlign: 'left', width: '100%' }}
                    >
                      {tool.name}
                    </button>
                  ))}
                </div>

                {/* Right Interactive Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* 1. Chatbot & Assistant */}
                  {aiHubTab === 'chat' && (
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>💬 AI Assistant & FAQ Advisor</h3>
                          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>Simulate real-time support queries or developer commands</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setAiChatMode('faq')}
                            style={{ background: aiChatMode === 'faq' ? '#a855f7' : 'rgba(255,255,255,0.05)', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                          >
                            FAQ Chatbot
                          </button>
                          <button
                            onClick={() => setAiChatMode('assistant')}
                            style={{ background: aiChatMode === 'assistant' ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Server Assistant
                          </button>
                        </div>
                      </div>

                      {/* Chat Messages scroll area */}
                      <div style={{ background: '#020617', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '16px', height: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {aiChatMessages.map((msg, i) => (
                          <div
                            key={i}
                            style={{
                              alignSelf: msg.sender === 'ai' ? 'flex-start' : 'flex-end',
                              background: msg.sender === 'ai' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                              border: `1px solid ${msg.sender === 'ai' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
                              color: msg.sender === 'ai' ? '#d8b4fe' : '#93c5fd',
                              padding: '10px 14px',
                              borderRadius: '12px',
                              maxWidth: '80%',
                              fontSize: '12.5px',
                              lineHeight: '1.5',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {msg.text}
                          </div>
                        ))}
                      </div>

                      {/* Chat message form */}
                      <form onSubmit={handleAiChatSubmit} style={{ display: 'flex', gap: '12px' }}>
                        <input
                          type="text"
                          value={aiChatInput}
                          onChange={(e) => setAiChatInput(e.target.value)}
                          placeholder={aiChatMode === 'faq' ? "Ask about pets, businesses, delivery..." : "Ask assistant for optimization tips..."}
                          style={{ flex: 1, background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px', fontSize: '13px' }}
                        />
                        <button
                          type="submit"
                          style={{ background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          Send Message
                        </button>
                      </form>
                    </div>
                  )}

                  {/* 2. Message Moderation & Spam/Scam Shield */}
                  {aiHubTab === 'moderate' && (
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🛡️ Safety Shield: Moderation, Spam & Scam Detector</h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>Scan messages for abusive terms, spam repeats, and phishing scam URLs</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <textarea
                          rows={3}
                          value={aiModText}
                          onChange={(e) => setAiModText(e.target.value)}
                          placeholder="Type or paste a mock chat message to analyze (e.g. 'Get free cherries at scam.ru' or 'Hate you scum!')..."
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px', fontSize: '13px', fontFamily: 'monospace', resize: 'vertical' }}
                        />
                        <button
                          onClick={handleAiModerateSubmit}
                          style={{ background: '#be123c', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', width: 'fit-content' }}
                        >
                          Analyze Message
                        </button>
                      </div>

                      {aiModResult && (
                        <div style={{ background: '#020617', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Safety Assessment Verdict:</span>
                            <span style={{
                              background: aiModResult.safe ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              border: `1px solid ${aiModResult.safe ? '#10b981' : '#ef4444'}`,
                              color: aiModResult.safe ? '#34d399' : '#f87171',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '800',
                              textTransform: 'uppercase'
                            }}>
                              {aiModResult.safe ? 'SAFE PASS ✅' : 'FLAGGED THREAT ❌'}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                              <span style={{ fontSize: '9px', color: '#cbd5e1', display: 'block' }}>PROFANITY CHECK</span>
                              <strong style={{ fontSize: '14px', color: aiModResult.checks.profane ? '#ef4444' : '#10b981' }}>
                                {aiModResult.checks.profane ? 'Detected' : 'Clear'}
                              </strong>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                              <span style={{ fontSize: '9px', color: '#cbd5e1', display: 'block' }}>SPAM FLAGGED</span>
                              <strong style={{ fontSize: '14px', color: aiModResult.checks.spam ? '#ef4444' : '#10b981' }}>
                                {aiModResult.checks.spam ? 'Detected' : 'Clear'}
                              </strong>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                              <span style={{ fontSize: '9px', color: '#cbd5e1', display: 'block' }}>SCAM ATTEMPT</span>
                              <strong style={{ fontSize: '14px', color: aiModResult.checks.scam ? '#ef4444' : '#10b981' }}>
                                {aiModResult.checks.scam ? 'Detected' : 'Clear'}
                              </strong>
                            </div>
                          </div>

                          {aiModResult.reasons.length > 0 && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '10px', borderRadius: '6px', fontSize: '11.5px', color: '#f87171' }}>
                              <strong>Trigger Flags Reasons:</strong>
                              <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                                {aiModResult.reasons.map((r, idx) => <li key={idx}>{r}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Summarizer & Support tickets */}
                  {aiHubTab === 'summarize' && (
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📝 AI Message Summarizer & Ticket Digest</h3>
                          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>Summarize support requests or RPG logs</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => { setAiSumType('log'); setAiSumResult(''); }}
                            style={{ background: aiSumType === 'log' ? '#a855f7' : 'rgba(255,255,255,0.05)', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Transaction Logs
                          </button>
                          <button
                            onClick={() => { setAiSumType('ticket'); setAiSumResult(''); }}
                            style={{ background: aiSumType === 'ticket' ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Support Tickets
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <textarea
                          rows={4}
                          value={aiSumText}
                          onChange={(e) => setAiSumText(e.target.value)}
                          placeholder={aiSumType === 'log' ? "Paste multi-line transaction logs here...\nExample:\nWon 500 cherries from dungeon\nSpend 300 cherries on feed\nCollected 1000 coins from business" : "Type player support ticket query...\nExample:\n'I bought a blacksmith level upgrade but my coins didn't update and I lost 5000 cherries! Please help.'"}
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px', fontSize: '13px', fontFamily: 'monospace', resize: 'vertical' }}
                        />
                        <button
                          onClick={handleAiSummarizeSubmit}
                          style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', width: 'fit-content' }}
                        >
                          Generate AI Digest
                        </button>
                      </div>

                      {aiSumResult && (
                        <div style={{ background: '#020617', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '16px', color: '#cbd5e1', fontSize: '12.5px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                          {aiSumResult}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. Translation & Grammar */}
                  {aiHubTab === 'translate' && (
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🌐 AI Translation & Grammar Guard</h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>Translate chat messages and correct common grammatical errors</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <textarea
                          rows={3}
                          value={aiTransText}
                          onChange={(e) => setAiTransText(e.target.value)}
                          placeholder="Type message to translate (e.g. 'hello player, how are you? I is looking to trade a cherry')..."
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px', fontSize: '13px', resize: 'vertical' }}
                        />

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '750' }}>Target Language:</span>
                          <select
                            value={aiTransLang}
                            onChange={(e) => setAiTransLang(e.target.value)}
                            style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px', cursor: 'pointer' }}
                          >
                            <option value="es">Spanish (Español)</option>
                            <option value="fr">French (Français)</option>
                            <option value="ja">Japanese (日本語)</option>
                          </select>
                          <button
                            onClick={handleAiTranslateSubmit}
                            style={{ background: '#10b981', color: '#000000', border: 'none', padding: '8px 20px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Translate
                          </button>
                        </div>
                      </div>

                      {aiTransResult && (
                        <div style={{ background: '#020617', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Translated Message:</span>
                            <strong style={{ fontSize: '14px', color: '#ffffff' }}>{aiTransResult.translatedText}</strong>
                          </div>
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', fontSize: '12px', color: '#fbbf24' }}>
                            {aiTransResult.grammarCorrection}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. Conversation Starters */}
                  {aiHubTab === 'starter' && (
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🎲 AI Chat Conversation Starters</h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>Generate creative prompt questions to spark guild or server conversations</p>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '750' }}>Topic Theme:</span>
                        <select
                          value={aiStarterCategory}
                          onChange={(e) => setAiStarterCategory(e.target.value)}
                          style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          <option value="RPG">Dungeon RPG Gameplay</option>
                          <option value="Business">Business Simulator Wealth</option>
                          <option value="Companion">Pet Companion Raising</option>
                          <option value="Guild">Guild Raiding Co-ops</option>
                        </select>
                        <button
                          onClick={handleAiStarterSubmit}
                          style={{ background: '#a855f7', color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          Generate Prompts
                        </button>
                      </div>

                      {aiStarterResult.length > 0 && (
                        <div style={{ background: '#020617', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Suggested Chat Starters:</span>
                          {aiStarterResult.map((prompt, index) => (
                            <div
                              key={index}
                              style={{
                                background: 'rgba(255,255,255,0.01)',
                                border: '1px solid rgba(255,255,255,0.03)',
                                padding: '12px',
                                borderRadius: '8px',
                                fontSize: '12.5px',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                              }}
                            >
                              <span>{prompt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* TAB: SERVER MODERATION & SECURITY */}
            {activeTab === 'server_mod' && loggedInUser && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* 1. Jail Penal State Alert (Only if user is currently jailed) */}
                {activePunishments.some(p => p.userId === loggedInUser && p.type === 'jail' && p.active) && (
                  <div className="glass-card glow-red" style={{ background: 'rgba(220, 38, 38, 0.12)', border: '1px solid rgba(220, 38, 38, 0.35)', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '32px' }}>⛓️</span>
                      <div>
                        <h3 style={{ margin: 0, color: '#f87171', fontSize: '18px', fontWeight: '900' }}>WARNING: YOU ARE CURRENTLY JAILED</h3>
                        <p style={{ margin: '4px 0 0 0', color: '#fca5a5', fontSize: '12px' }}>
                          You have been jailed for: <em>"{activePunishments.find(p => p.userId === loggedInUser && p.type === 'jail' && p.active)?.reason}"</em>.
                          You cannot participate in dungeon combat or collect commercial business payouts until released!
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handlePayBail}
                      className="collect-btn"
                      style={{ background: '#f59e0b', color: '#000000', fontWeight: '850', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '12.5px', cursor: 'pointer' }}
                    >
                      Post Bail (🍒 5,000 cherries)
                    </button>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  
                  {/* Left Column: Security Settings Grid */}
                  <div className="glass-card glow-violet" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#c084fc' }}>🛡️ Security Grids & Auto-Mod policies</h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>Activate or customize automated server boundary controls</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {[
                        { key: 'antiRaid', title: '🛡️ Anti-Raid Mode', desc: 'Blocks join bursts > 5 joins/min' },
                        { key: 'antiNuke', title: '⚙️ Anti-Nuke Shield', desc: 'Blocks mass role/channel wipes' },
                        { key: 'antiSpam', title: '🚫 Anti-Spam Filter', desc: 'Flags fast repeating messages' },
                        { key: 'antiScam', title: '🎣 Anti-Scam Guard', desc: 'Flags unverified URL gifts/coins' },
                        { key: 'antiLink', title: '🔗 Anti-Link Rule', desc: 'Blocks external hyperlinks' },
                        { key: 'antiMention', title: '📣 Anti-Mention Spam', desc: 'Blocks > 4 user mentions' }
                      ].map((item) => (
                        <div
                          key={item.key}
                          onClick={() => handleSecurityToggle(item.key)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${securitySettings[item.key] ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.05)'}`,
                            borderRadius: '10px',
                            padding: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '13px', color: '#ffffff' }}>{item.title}</strong>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: securitySettings[item.key] ? '#10b981' : '#ef4444',
                              boxShadow: securitySettings[item.key] ? '0 0 8px #10b981' : 'none'
                            }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{item.desc}</span>
                          <strong style={{ fontSize: '10px', color: securitySettings[item.key] ? '#10b981' : '#94a3b8', textTransform: 'uppercase', marginTop: '4px' }}>
                            {securitySettings[item.key] ? 'ACTIVE' : 'DISABLED'}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: invite tracker */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🎟️ Invite Code join Tracking</h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>Track which invitations were used to join the server</p>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', textAlign: 'left' }}>
                            <th style={{ padding: '10px' }}>INVITE CODE</th>
                            <th style={{ padding: '10px' }}>CREATOR</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>TOTAL JOINS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inviteLogs.map((inv, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: '700', color: '#c084fc' }}>{inv.code}</td>
                              <td style={{ padding: '10px', color: '#ffffff' }}>{inv.creator}</td>
                              <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#10b981' }}>{inv.joins} users</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  
                  {/* Left Column: Admin punishment issuer */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🚨 Administrative Punishments terminal</h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>Issue temporary suspensions, muting, or RPG incarceration (Jail)</p>
                    </div>

                    <form onSubmit={handlePunishSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>TARGET CHARACTER ID</label>
                          <input
                            type="text"
                            value={punishUserId}
                            onChange={(e) => setPunishUserId(e.target.value)}
                            placeholder="e.g. 1"
                            style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px', fontSize: '12px' }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>PUNISHMENT METHOD</label>
                          <select
                            value={punishType}
                            onChange={(e) => setPunishType(e.target.value)}
                            style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px', fontSize: '12px' }}
                          >
                            <option value="jail">⛓️ Incarcerate (Jail state)</option>
                            <option value="mute">🔇 Mute Voice & Chat</option>
                            <option value="ban">🚫 Temporarily Ban Member</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>PUNISHMENT DURATION (MINUTES)</label>
                          <input
                            type="number"
                            value={punishDuration}
                            onChange={(e) => setPunishDuration(e.target.value)}
                            style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px', fontSize: '12px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>REASON / INCIDENT REPORT</label>
                        <input
                          type="text"
                          value={punishReason}
                          onChange={(e) => setPunishReason(e.target.value)}
                          placeholder="e.g. Spammed link giveaways in chat"
                          style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px', fontSize: '12px' }}
                        />
                      </div>

                      <button
                        type="submit"
                        style={{ background: 'linear-gradient(135deg, #ef4444 0%, #be123c 100%)', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '6px', fontSize: '13px', fontWeight: '850', cursor: 'pointer', marginTop: '8px' }}
                      >
                        Apply Punishment Action
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Active Inmates / Penal Ledger */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>⚖️ Active Punishments Ledger</h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>Live list of muted, jailed, or temporarily banned users</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                      {activePunishments.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '32px' }}>
                          🕊️ No active punishments. The guild is fully safe and secure.
                        </div>
                      ) : (
                        activePunishments.map((p) => (
                          <div
                            key={p.id}
                            style={{
                              background: 'rgba(255,255,255,0.01)',
                              border: '1px solid rgba(255,255,255,0.03)',
                              borderRadius: '8px',
                              padding: '12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  background: p.type === 'ban' ? '#ef4444' : p.type === 'mute' ? '#fbbf24' : '#a855f7',
                                  color: '#000000',
                                  fontSize: '10px',
                                  fontWeight: '900',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase'
                                }}>
                                  {p.type}
                                </span>
                                <strong style={{ fontSize: '13px', color: '#ffffff' }}>User: {p.userId}</strong>
                              </div>
                              <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#cbd5e1' }}>
                                Reason: <em>"{p.reason}"</em>
                              </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>EXPIRES IN</span>
                              <strong style={{ fontSize: '12px', color: '#ef4444' }}>
                                {p.active ? `${Math.ceil((p.expiresAt - Date.now()) / (60 * 1000))} min` : 'EXPIRED'}
                              </strong>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB: COMMUNITY HUB */}
            {activeTab === 'community' && loggedInUser && communityData && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '24px' }}>
                
                {/* Left Column: News, Milestones, and Goals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Server News announcements */}
                  <div className="glass-card glow-violet" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '850', color: '#c084fc' }}>📢 Server News & Updates</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {communityData.news?.map((n) => (
                        <div key={n.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                          <strong style={{ fontSize: '13px', color: '#ffffff', display: 'block' }}>{n.title}</strong>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.5' }}>{n.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Community goals progress bar */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>🏰 Crowd-Funded Community Goals</h3>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#cbd5e1' }}>Pool your cherries to fund upgrades for the server castle!</p>
                    
                    <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
                      <strong style={{ fontSize: '12.5px', color: '#fbbf24', display: 'block', marginBottom: '8px' }}>{communityData.goal?.title}</strong>
                      
                      <div className="raid-bar" style={{ height: '14px', borderRadius: '7px', marginBottom: '8px' }}>
                        <div
                          className="raid-bar-fill"
                          style={{
                            width: `${Math.min(100, (communityData.goal?.current / communityData.goal?.target) * 100)}%`,
                            background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                            borderRadius: '7px',
                            boxShadow: '0 0 8px #fbbf24'
                          }}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1' }}>
                        <span>Progress: <strong>{Math.floor((communityData.goal?.current / communityData.goal?.target) * 100)}%</strong></span>
                        <span>🍒 {communityData.goal?.current?.toLocaleString()} / {communityData.goal?.target?.toLocaleString()}</span>
                      </div>
                    </div>

                    <form onSubmit={handleContributeGoal} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        value={goalContribAmount}
                        onChange={(e) => setGoalContribAmount(e.target.value)}
                        placeholder="Amt"
                        style={{ width: '80px', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                      />
                      <button
                        type="submit"
                        style={{ flex: 1, background: '#10b981', color: '#000000', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '850', cursor: 'pointer' }}
                      >
                        Contribute Cherries
                      </button>
                    </form>
                  </div>

                  {/* Member Milestones */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>🏆 Member Milestones</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                      {[
                        { title: '👥 First 100 Inhabitants', desc: 'Accomplished on launch day', done: true },
                        { title: '⚔️ 1,000 Dungeon Boss Defeats', desc: 'Accrued across active guild rosters', done: true },
                        { title: '💰 500k Cherries in Stock Market', desc: 'Aggregate assets value owned by players', done: false }
                      ].map((mile, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '6px' }}>
                          <span style={{ fontSize: '16px' }}>{mile.done ? '✅' : '⏳'}</span>
                          <div>
                            <strong style={{ color: mile.done ? '#ffffff' : '#94a3b8' }}>{mile.title}</strong>
                            <p style={{ margin: 0, fontSize: '10.5px', color: '#94a3b8' }}>{mile.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Middle Column: Daily Question, Polls, and Confessions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Daily Question */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>❓ Question of the Day</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#fbbf24', fontWeight: '750' }}>"{communityData.dailyQuestion?.question}"</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', background: '#020617', border: '1px solid rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px' }}>
                      {communityData.dailyQuestion?.answers?.length === 0 ? (
                        <span style={{ fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic' }}>No answers submitted yet. Be the first!</span>
                      ) : (
                        communityData.dailyQuestion?.answers?.map((ans, idx) => (
                          <div key={idx} style={{ fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                            <strong style={{ color: '#c084fc' }}>{ans.author}:</strong> <span style={{ color: '#cbd5e1' }}>{ans.text}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleAnswerDaily} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={dailyAnswerInput}
                        onChange={(e) => setDailyAnswerInput(e.target.value)}
                        placeholder="Write your answer..."
                        style={{ flex: 1, background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                      />
                      <button
                        type="submit"
                        style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer' }}
                      >
                        Submit
                      </button>
                    </form>
                  </div>

                  {/* Poll Creator & Active Polls */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>🗳️ Active Polls & Voting</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {communityData.polls?.map((p) => {
                        const total = p.votesA + p.votesB;
                        const pctA = total > 0 ? Math.round((p.votesA / total) * 100) : 50;
                        const pctB = total > 0 ? Math.round((p.votesB / total) * 100) : 50;

                        return (
                          <div key={p.id} style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px' }}>
                            <strong style={{ fontSize: '12.5px', color: '#ffffff', display: 'block', marginBottom: '8px' }}>{p.question}</strong>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                              <button
                                onClick={() => handleVotePoll(p.id, 'A')}
                                style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '8px 12px', borderRadius: '6px', color: '#93c5fd', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', width: '100%' }}
                              >
                                <span>{p.optionA}</span>
                                <strong>{pctA}% ({p.votesA})</strong>
                              </button>
                              
                              <button
                                onClick={() => handleVotePoll(p.id, 'B')}
                                style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '8px 12px', borderRadius: '6px', color: '#d8b4fe', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', width: '100%' }}
                              >
                                <span>{p.optionB}</span>
                                <strong>{pctB}% ({p.votesB})</strong>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                      <strong style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>CREATE A NEW POLL</strong>
                      <form onSubmit={handleCreatePoll} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                          type="text"
                          value={newPollQuestion}
                          onChange={(e) => setNewPollQuestion(e.target.value)}
                          placeholder="Poll Question..."
                          style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <input
                            type="text"
                            value={newPollOptA}
                            onChange={(e) => setNewPollOptA(e.target.value)}
                            placeholder="Option A"
                            style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                          />
                          <input
                            type="text"
                            value={newPollOptB}
                            onChange={(e) => setNewPollOptB(e.target.value)}
                            placeholder="Option B"
                            style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                          />
                        </div>
                        <button
                          type="submit"
                          style={{ background: '#a855f7', color: '#ffffff', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '850', cursor: 'pointer' }}
                        >
                          Launch Poll
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Confession System */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>🔒 Anonymous Confession wall</h3>
                    
                    <form onSubmit={handlePostConfess} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={confessInput}
                        onChange={(e) => setConfessInput(e.target.value)}
                        placeholder="Write a secret confession..."
                        style={{ flex: 1, background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                      />
                      <button
                        type="submit"
                        style={{ background: '#be123c', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                      >
                        Confess
                      </button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                      {communityData.confessions?.map((c) => (
                        <div key={c.id} className="confession-card" style={{ background: '#fef08a', color: '#854d0e', padding: '12px', borderRadius: '8px', fontSize: '12.5px', boxShadow: '2px 2px 8px rgba(0,0,0,0.1)' }}>
                          <span style={{ fontSize: '10px', color: '#ca8a04', display: 'block', fontWeight: '800', marginBottom: '4px' }}>ANONYMOUS CONFESSION #{c.id}</span>
                          "{c.text}"
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Column: Starboard, Birthdays, Calendar & Rep */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Reputation commend list */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>✨ Reputation Panel</h3>
                      <span style={{ fontSize: '12.5px', color: '#10b981', fontWeight: '800' }}>My Rep: +{communityData.myReputation}</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <strong style={{ fontSize: '11px', color: '#cbd5e1' }}>COMMEND PLAYER FOR HELPFULNESS</strong>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleCommendRep('1')}
                          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '750', cursor: 'pointer' }}
                        >
                          👍 FarmerBob
                        </button>
                        <button
                          onClick={() => handleCommendRep('2')}
                          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '750', cursor: 'pointer' }}
                        >
                          👍 HealerLvl9
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Starboard highlights showcase */}
                  <div className="glass-card glow-violet" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '850', color: '#f59e0b' }}>⭐ Starboard Highlights</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                      {communityData.starboard?.map((s) => (
                        <div key={s.id} style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '10px', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '11.5px', color: '#fef08a' }}>@{s.author}</strong>
                            <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '800' }}>⭐ {s.stars} stars</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '11.5px', color: '#ffffff' }}>"{s.content}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Birthdays calendar list */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>🎂 Guild Birthdays</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {communityData.birthdays?.map((birth, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '6px' }}>
                          <div>
                            <strong style={{ fontSize: '12.5px', color: '#ffffff' }}>{birth.name}</strong>
                            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Date: {birth.date}</span>
                          </div>
                          <button
                            onClick={() => handleWishBirthday(birth.userId)}
                            style={{ background: '#a855f7', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '850', cursor: 'pointer' }}
                          >
                            Wish 🎉
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Event Calendar list */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>📅 Event Calendar</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {communityData.events?.map((ev) => (
                        <div key={ev.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                          <strong style={{ fontSize: '12.5px', color: '#ffffff', display: 'block' }}>{ev.title}</strong>
                          <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', margin: '2px 0 6px 0' }}>📅 Scheduled: {ev.date}</span>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '10.5px', color: '#cbd5e1' }}>Attendees: {ev.attendees?.length || 0} registered</span>
                            <button
                              onClick={() => handleEventRegister(ev.id)}
                              style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}
                            >
                              Register
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB: ANALYTICS SUITE */}
            {activeTab === 'analytics' && loggedInUser && analyticsData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* 1. Health Score Board & Growth Analytics Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '24px' }}>
                  
                  {/* Server Health Metric */}
                  <div className="glass-card glow-violet" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '16px', padding: '32px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '850', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '1px' }}>🛡️ Server Health Score</h3>
                    
                    <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="65" cy="65" r="55" stroke="rgba(255,255,255,0.03)" strokeWidth="12" fill="none" />
                        <circle
                          cx="65"
                          cy="65"
                          r="55"
                          stroke="url(#purpleGradient)"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 55}
                          strokeDashoffset={2 * Math.PI * 55 * (1 - analyticsData.healthScore / 100)}
                          strokeLinecap="round"
                          style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.4))' }}
                        />
                        <defs>
                          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#c084fc" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '32px', fontWeight: '950', color: '#ffffff', lineHeight: '1' }}>{analyticsData.healthScore}%</span>
                        <span style={{ fontSize: '9px', color: '#10b981', fontWeight: '850', marginTop: '4px', letterSpacing: '0.5px' }}>EXCELLENT</span>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.5' }}>
                      Calculated dynamically based on Auto-Mod filter pass-rates, low moderation actions ratio, and user joins retention stability.
                    </p>
                  </div>

                  {/* Growth Dashboard Grid */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📈 Server Growth Dashboard</h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>Visualizing member count growth curves over the last 7 days</p>
                      </div>
                      <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', color: '#34d399', padding: '4px 10px', borderRadius: '20px', fontWeight: '750' }}>
                        +42% Growth Rate
                      </span>
                    </div>

                    {/* growth bar chart */}
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', height: '140px', padding: '16px 8px 8px 8px', background: '#020617', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', justifyContent: 'space-between' }}>
                      {analyticsData.growth?.map((pt, idx) => {
                        const maxVal = Math.max(...analyticsData.growth.map(p => p.members));
                        const fillPct = (pt.members / maxVal) * 100;
                        return (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                            <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '700' }}>{pt.members}</div>
                            <div style={{ width: '100%', maxWidth: '36px', height: '80px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
                              <div
                                style={{
                                  width: '100%',
                                  height: `${fillPct}%`,
                                  background: 'linear-gradient(180deg, #c084fc 0%, #6366f1 100%)',
                                  borderRadius: '2px'
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: '700' }}>{pt.date}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* 2. Chat Activity Heatmap */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🗓️ Chat Activity Heatmap</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>Hourly message density grid throughout the week (hours represented in UTC+0)</p>
                  </div>

                  <div style={{ overflowX: 'auto', background: '#020617', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '700px' }}>
                      {analyticsData.heatmap?.map((row) => (
                        <div key={row.day} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '40px', fontSize: '11px', color: '#cbd5e1', fontWeight: '750', textTransform: 'uppercase' }}>{row.day}</span>
                          <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                            {row.hours.map((val, idx) => {
                              const colors = [
                                'rgba(255,255,255,0.02)', // 0: empty
                                '#3b0764',                // 1: low
                                '#581c87',                // 2: medium
                                '#7e22ce',                // 3: high
                                '#a855f7'                 // 4: peak
                              ];
                              return (
                                <div
                                  key={idx}
                                  title={`${row.day} Hour ${idx}:00 - Message Density ${val}`}
                                  className="heatmap-cell"
                                  style={{
                                    flex: 1,
                                    height: '20px',
                                    background: colors[val],
                                    borderRadius: '3px',
                                    border: '1px solid rgba(255,255,255,0.02)',
                                    transition: 'all 0.15s ease',
                                    cursor: 'pointer'
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Hour numbers line */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                        <span style={{ width: '40px' }} />
                        <div style={{ display: 'flex', gap: '4px', flex: 1, justifyContent: 'space-between', fontSize: '9px', color: '#64748b', padding: '0 4px', fontWeight: '700' }}>
                          <span>12 AM</span>
                          <span>4 AM</span>
                          <span>8 AM</span>
                          <span>12 PM</span>
                          <span>4 PM</span>
                          <span>8 PM</span>
                          <span>11 PM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Stats details: Voice, Channel, Invite & Retention stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '24px' }}>
                  
                  {/* Voice statistics */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🔊 Voice Statistics</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>ACTIVE VOICE USERS</span>
                        <strong style={{ fontSize: '20px', color: '#c084fc' }}>{analyticsData.voiceStats?.activeUsers} users</strong>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>AVG CALL DURATION</span>
                        <strong style={{ fontSize: '20px', color: '#fbbf24' }}>{analyticsData.voiceStats?.avgDuration} min</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', marginTop: '4px' }}>
                      <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: '750', letterSpacing: '0.5px', textTransform: 'uppercase' }}>VOICE CHANNELS LOAD</span>
                      {analyticsData.voiceStats?.channels?.map((ch, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                          <span style={{ color: '#ffffff' }}>{ch.name}</span>
                          <strong style={{ color: '#10b981' }}>{ch.users} users</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Channel stats */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>💬 Channel Statistics</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                      {analyticsData.channelStats?.map((ch, idx) => {
                        const totalMsgs = analyticsData.channelStats.reduce((sum, c) => sum + c.messages, 0);
                        const widthPct = (ch.messages / totalMsgs) * 100;
                        return (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#ffffff', fontWeight: '700' }}>{ch.channel}</span>
                              <span style={{ color: '#94a3b8' }}>{ch.messages} msgs</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${widthPct}%`, height: '100%', background: '#3b82f6' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Retention stats */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>👥 Retention Analytics</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { label: 'Day 1 Retention', val: analyticsData.retention?.day1, color: '#10b981' },
                        { label: 'Day 7 Retention', val: analyticsData.retention?.day7, color: '#3b82f6' },
                        { label: 'Day 30 Retention', val: analyticsData.retention?.day30, color: '#a855f7' }
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ color: '#ffffff' }}>{item.label}</span>
                            <strong style={{ color: item.color }}>{item.val}%</strong>
                          </div>
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${item.val}%`, height: '100%', background: item.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* 4. Moderator, invite analytics, Emojis & Trends */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '24px' }}>
                  
                  {/* Trend reports */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>📊 Server Trend Reports</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {analyticsData.trendReports?.map((tr, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '14px' }}>{tr.type === 'up' ? '📈' : '📉'}</span>
                            <strong style={{ fontSize: '12.5px', color: tr.type === 'up' ? '#34d399' : '#f87171' }}>{tr.title}</strong>
                          </div>
                          <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>{tr.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Invite Analytics */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🎟️ Invite Link Analytics</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                      {analyticsData.inviteAnalytics?.map((inv, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                          <div>
                            <strong style={{ color: '#c084fc', fontFamily: 'monospace' }}>{inv.code}</strong>
                            <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>Conversion: {inv.rate}%</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ color: '#ffffff', display: 'block' }}>{inv.joins} joins</strong>
                            <span style={{ fontSize: '9px', color: '#10b981', fontWeight: '750' }}>ACTIVE</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emoji Usage & Moderator analytics */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🍒 Emoji Usage Metrics</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'center' }}>
                      {analyticsData.emojiUsage?.map((em, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px' }}>
                          <span style={{ fontSize: '20px' }}>{em.emoji}</span>
                          <strong style={{ fontSize: '11px', color: '#ffffff', display: 'block', marginTop: '4px' }}>{em.count}</strong>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '4px' }}>
                      <strong style={{ fontSize: '10.5px', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>STAFF MODERATOR ACTIONS</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
                        {analyticsData.moderatorAnalytics?.map((mod, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                            <span>👮 {mod.name}</span>
                            <strong>{mod.actions} actions</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB: TICKETS */}
            {activeTab === 'tickets' && loggedInUser && ticketsData && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
                
                {/* Left Column: Dashboard stats, creation form, and list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Ticket Dashboard Stats */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🎟️ Support Dashboard</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px 4px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Open</span>
                        <strong style={{ fontSize: '18px', color: '#3b82f6' }}>
                          {ticketsData.tickets?.filter(t => t.status === 'Open').length}
                        </strong>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px 4px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Closed</span>
                        <strong style={{ fontSize: '18px', color: '#10b981' }}>
                          {ticketsData.tickets?.filter(t => t.status === 'Closed').length}
                        </strong>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px 4px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Escalated</span>
                        <strong style={{ fontSize: '18px', color: '#be123c' }}>
                          {ticketsData.tickets?.filter(t => t.priority === 'Emergency').length}
                        </strong>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px 4px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Breaches</span>
                        <strong style={{ fontSize: '18px', color: '#fbbf24' }}>
                          {ticketsData.tickets?.filter(t => t.status === 'Open' && t.slaLimit < Date.now()).length}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Create Ticket Panel */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>📩 Open New Support Ticket</h3>
                    
                    {/* Ticket Templates */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <button
                        onClick={() => {
                          setNewTicketCategory('Bug Report');
                          setNewTicketPriority('High');
                          setNewTicketSubject('Visual bug on client map');
                          setNewTicketDetail('I observed visual delay glitches when trying to refresh elements on the map page.');
                        }}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', color: '#ffffff', cursor: 'pointer' }}
                      >
                        🐛 Bug Template
                      </button>
                      <button
                        onClick={() => {
                          setNewTicketCategory('General Question');
                          setNewTicketPriority('Low');
                          setNewTicketSubject('How to adopt pets');
                          setNewTicketDetail('I want to know where to buy seeds/food to adopt and level up companion pets.');
                        }}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', color: '#ffffff', cursor: 'pointer' }}
                      >
                        ❓ Q&A Template
                      </button>
                      <button
                        onClick={() => {
                          setNewTicketCategory('Punishment Appeal');
                          setNewTicketPriority('Medium');
                          setNewTicketSubject('Mute appeal');
                          setNewTicketDetail('I was jailed/muted by automatic chat filters. I promise to keep general chat clean.');
                        }}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', color: '#ffffff', cursor: 'pointer' }}
                      >
                        ⚖️ Appeal Template
                      </button>
                    </div>

                    <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Category</label>
                          <select
                            value={newTicketCategory}
                            onChange={(e) => setNewTicketCategory(e.target.value)}
                            style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                          >
                            {ticketsData.categories?.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Priority</label>
                          <select
                            value={newTicketPriority}
                            onChange={(e) => setNewTicketPriority(e.target.value)}
                            style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                          >
                            <option value="Low">Low (24hr SLA)</option>
                            <option value="Medium">Medium (12hr SLA)</option>
                            <option value="High">High (4hr SLA)</option>
                            <option value="Emergency">Emergency (1hr SLA)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Subject</label>
                        <input
                          type="text"
                          value={newTicketSubject}
                          onChange={(e) => setNewTicketSubject(e.target.value)}
                          placeholder="Brief title of the issue"
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Details</label>
                        <textarea
                          value={newTicketDetail}
                          onChange={(e) => setNewTicketDetail(e.target.value)}
                          placeholder="Explain your problem or question in detail..."
                          rows={3}
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px', resize: 'none' }}
                        />
                      </div>

                      <button
                        type="submit"
                        style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: '850', cursor: 'pointer' }}
                      >
                        Submit Ticket
                      </button>
                    </form>
                  </div>

                  {/* Active tickets lists */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>📂 Your Tickets</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                      {ticketsData.tickets?.length === 0 ? (
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No tickets created yet.</span>
                      ) : (
                        ticketsData.tickets?.map((t) => {
                          const isOverSLA = t.status === 'Open' && t.slaLimit < Date.now();
                          const priorityColor = 
                            t.priority === 'Emergency' ? '#ef4444' :
                            t.priority === 'High' ? '#f97316' :
                            t.priority === 'Medium' ? '#fbbf24' : '#10b981';

                          return (
                            <div
                              key={t.id}
                              onClick={() => {
                                setActiveTicketId(t.id);
                                setTicketStaffNotesText(t.staffNotes || '');
                              }}
                              style={{
                                background: activeTicketId === t.id ? 'rgba(255,255,255,0.04)' : '#090d16',
                                border: `1px solid ${activeTicketId === t.id ? '#a855f7' : 'rgba(255,255,255,0.05)'}`,
                                padding: '12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '750' }}>TICKET #{t.id} - {t.category}</span>
                                <span style={{ fontSize: '10px', background: `${priorityColor}15`, border: `1px solid ${priorityColor}`, color: priorityColor, padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                                  {t.priority}
                                </span>
                              </div>
                              
                              <strong style={{ fontSize: '13px', color: '#ffffff', display: 'block', marginBottom: '4px' }}>{t.subject}</strong>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                                <span>Status: <strong style={{ color: t.status === 'Open' ? '#3b82f6' : '#10b981' }}>{t.status}</strong></span>
                                {isOverSLA ? (
                                  <span style={{ color: '#ef4444', fontWeight: '800' }}>⚠️ SLA BREACHED</span>
                                ) : (
                                  <span>Assigned: <strong>{t.assignedTo}</strong></span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Column: Ticket Conversation Thread & Actions */}
                <div>
                  {activeTicketId ? (() => {
                    const ticket = ticketsData.tickets?.find(t => t.id === activeTicketId);
                    if (!ticket) return null;

                    const isOverSLA = ticket.status === 'Open' && ticket.slaLimit < Date.now();
                    const timeLeft = ticket.slaLimit - Date.now();
                    const hoursLeft = Math.floor(timeLeft / (3600 * 1000));
                    const minsLeft = Math.floor((timeLeft % (3600 * 1000)) / (60 * 1000));

                    const triggerTranscriptExport = () => {
                      const header = `=== CHERRY PORTAL SUPPORT TICKET TRANSCRIPT ===\n`;
                      const meta = `Ticket ID: ${ticket.id}\nCategory: ${ticket.category}\nPriority: ${ticket.priority}\nSubject: ${ticket.subject}\nAssigned Agent: ${ticket.assignedTo}\nStatus: ${ticket.status}\nCSAT Rating: ${ticket.satisfaction || 'Not Rated'}\n\n`;
                      const thread = ticket.messages.map(m => `[${m.author}]: ${m.text}`).join('\n');
                      
                      const blob = new Blob([header + meta + thread], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `ticket-${ticket.id}-transcript.txt`;
                      a.click();
                    };

                    return (
                      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
                        
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>TICKET #{ticket.id} / @{ticket.author}</span>
                            <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '800' }}>{ticket.subject}</h3>
                          </div>
                          
                          <button
                            onClick={triggerTranscriptExport}
                            style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '6px 12px', borderRadius: '6px', color: '#d8b4fe', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                          >
                            💾 Export Transcript
                          </button>
                        </div>

                        {ticket.status === 'Open' && (
                          <div style={{ background: isOverSLA ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.08)', border: `1px solid ${isOverSLA ? '#ef4444' : '#3b82f6'}`, borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#ffffff' }}>⏱️ Response SLA Timer Limit:</span>
                            {isOverSLA ? (
                              <strong style={{ fontSize: '12px', color: '#ef4444' }}>BREACHED ALERT ({Math.abs(hoursLeft)}h {Math.abs(minsLeft)}m overdue)</strong>
                            ) : (
                              <strong style={{ fontSize: '12px', color: '#fbbf24' }}>{hoursLeft}h {minsLeft}m remaining</strong>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', padding: '8px', background: '#020617', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                          {ticket.messages.map((m, idx) => {
                            const isMe = m.author === loggedInCharName;
                            return (
                              <div
                                key={idx}
                                style={{
                                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                                  maxWidth: '80%',
                                  background: isMe ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255,255,255,0.02)',
                                  border: `1px solid ${isMe ? '#a855f7' : 'rgba(255,255,255,0.05)'}`,
                                  padding: '10px 14px',
                                  borderRadius: '10px',
                                  fontSize: '12.5px'
                                }}
                              >
                                <strong style={{ fontSize: '10.5px', color: isMe ? '#d8b4fe' : '#3b82f6', display: 'block', marginBottom: '4px' }}>@{m.author}</strong>
                                <span style={{ color: '#cbd5e1', lineHeight: '1.4' }}>{m.text}</span>
                              </div>
                            );
                          })}
                        </div>

                        {ticket.status === 'Open' ? (
                          <form onSubmit={handleTicketReply} style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              value={ticketReplyText}
                              onChange={(e) => setTicketReplyText(e.target.value)}
                              placeholder="Write reply response details..."
                              style={{ flex: 1, background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                            />
                            <button
                              type="submit"
                              style={{ background: '#a855f7', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer' }}
                            >
                              Send Message
                            </button>
                          </form>
                        ) : (
                          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center', fontSize: '12.5px', color: '#10b981' }}>
                            🔒 Ticket closed. Satisfaction Rating: {'⭐'.repeat(ticket.satisfaction || 5)}
                          </div>
                        )}

                        {ticketsData.isStaff && (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <strong style={{ fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>👮 PRIVATE STAFF NOTES (Moderators Only)</strong>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="text"
                                value={ticketStaffNotesText}
                                onChange={(e) => setTicketStaffNotesText(e.target.value)}
                                placeholder="Add notes (visible to staff only)..."
                                style={{ flex: 1, background: '#020617', color: '#ffffff', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                              />
                              <button
                                onClick={handleUpdateStaffNotes}
                                style={{ background: 'rgba(255,255,255,0.06)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '750', cursor: 'pointer' }}
                              >
                                Save Notes
                              </button>
                            </div>
                          </div>
                        )}

                        {ticket.status === 'Open' && (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', display: 'flex', gap: '10px' }}>
                            {ticket.priority !== 'Emergency' && (
                              <button
                                onClick={handleEscalateTicket}
                                style={{ flex: 1, background: '#be123c', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '6px', fontSize: '12.5px', fontWeight: '850', cursor: 'pointer' }}
                              >
                                ⚡ Escalate Priority
                              </button>
                            )}
                            
                            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                <span style={{ fontSize: '10px', color: '#94a3b8' }}>Close CSAT:</span>
                                {[1, 2, 3, 4, 5].map(star => (
                                  <span
                                    key={star}
                                    onClick={() => setTicketSatisfactionRating(star)}
                                    style={{
                                      cursor: 'pointer',
                                      fontSize: '16px',
                                      color: star <= ticketSatisfactionRating ? '#fbbf24' : '#475569',
                                      transition: 'color 0.15s ease'
                                    }}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <button
                                onClick={handleCloseTicket}
                                style={{ width: '100%', background: '#10b981', color: '#000000', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12.5px', fontWeight: '850', cursor: 'pointer' }}
                              >
                                Close & Rate Support
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })() : (
                    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                      <span style={{ fontSize: '13px', color: '#cbd5e1', fontStyle: 'italic' }}>Select a ticket from the left panel to display thread</span>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB: APPLICATIONS */}
            {activeTab === 'applications' && loggedInUser && applicationsData && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
                
                {/* Left Column: Stats, dynamic submission forms, and queue list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Recruitment dashboard stats */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>📊 Recruitment Dashboard</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px 4px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Total</span>
                        <strong style={{ fontSize: '18px', color: '#ffffff' }}>
                          {applicationsData.applications?.length}
                        </strong>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px 4px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Pending</span>
                        <strong style={{ fontSize: '18px', color: '#fbbf24' }}>
                          {applicationsData.applications?.filter(a => a.status === 'Pending').length}
                        </strong>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px 4px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Approved</span>
                        <strong style={{ fontSize: '18px', color: '#10b981' }}>
                          {applicationsData.applications?.filter(a => a.status === 'Approved').length}
                        </strong>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px 4px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Auto-App</span>
                        <strong style={{ fontSize: '18px', color: '#a855f7' }}>
                          {applicationsData.applications?.filter(a => a.autoAccepted).length}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Submission form panel */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>✍️ Submit Application / Appeal</h3>
                    
                    <form onSubmit={handleCreateApplication} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Application Type</label>
                        <select
                          value={newAppType}
                          onChange={(e) => setNewAppType(e.target.value)}
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                        >
                          {applicationsData.appTypes?.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      {/* Whitelist / Staff fields: Age, Timezone */}
                      {(newAppType === 'Staff Application' || newAppType === 'Whitelist Application') && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Applicant Age</label>
                            <input
                              type="number"
                              value={appAgeInput}
                              onChange={(e) => setAppAgeInput(e.target.value)}
                              style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                            />
                            {newAppType === 'Whitelist Application' && (
                              <span style={{ fontSize: '9px', color: '#a855f7', display: 'block', marginTop: '2px' }}>Auto Acceptance rules apply if age &ge; 18</span>
                            )}
                          </div>
                          
                          {newAppType === 'Staff Application' && (
                            <div>
                              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Timezone</label>
                              <input
                                type="text"
                                value={appTimezoneInput}
                                onChange={(e) => setAppTimezoneInput(e.target.value)}
                                placeholder="e.g. UTC+1"
                                style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Creator fields: YouTube stats */}
                      {newAppType === 'Creator Application' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Channel Subscriber Count</label>
                            <input
                              type="number"
                              value={appSubsInput}
                              onChange={(e) => setAppSubsInput(e.target.value)}
                              style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                            />
                            <span style={{ fontSize: '9px', color: '#a855f7', display: 'block', marginTop: '2px' }}>Auto-Approve if subscribers &ge; 1000</span>
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>YouTube/Twitch URL</label>
                            <input
                              type="text"
                              value={appChannelUrlInput}
                              onChange={(e) => setAppChannelUrlInput(e.target.value)}
                              placeholder="youtube.com/mychannel"
                              style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Experience Text Area */}
                      {newAppType === 'Staff Application' && (
                        <div>
                          <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Prior Staff Experience Details</label>
                          <textarea
                            value={appExperienceInput}
                            onChange={(e) => setAppExperienceInput(e.target.value)}
                            placeholder="Detail your experience in moderating community platforms..."
                            rows={3}
                            style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px', resize: 'none' }}
                          />
                        </div>
                      )}

                      {/* Description / Statement Text area */}
                      <div>
                        <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Application Statement / Description Details</label>
                        <textarea
                          value={appDescInput}
                          onChange={(e) => setAppDescInput(e.target.value)}
                          placeholder="Write a message explaining your request details..."
                          rows={3}
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px', resize: 'none' }}
                        />
                      </div>

                      <button
                        type="submit"
                        style={{ background: '#c084fc', color: '#000000', border: 'none', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: '850', cursor: 'pointer' }}
                      >
                        Submit Application
                      </button>
                    </form>
                  </div>

                  {/* Submitted queue list */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>📂 Submitted Applications</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                      {applicationsData.applications?.length === 0 ? (
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No submissions logged yet.</span>
                      ) : (
                        applicationsData.applications?.map(app => {
                          const statusColor = 
                            app.status === 'Approved' ? '#10b981' :
                            app.status === 'Denied' ? '#ef4444' :
                            app.status === 'Under Review' ? '#a855f7' : '#fbbf24';

                          return (
                            <div
                              key={app.id}
                              onClick={() => {
                                setActiveAppId(app.id);
                                setAppInterviewTime(app.interviewTime || '');
                              }}
                              style={{
                                background: activeAppId === app.id ? 'rgba(255,255,255,0.04)' : '#090d16',
                                border: `1px solid ${activeAppId === app.id ? '#c084fc' : 'rgba(255,255,255,0.05)'}`,
                                padding: '12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '750' }}>APP #{app.id} - {app.type}</span>
                                <span style={{ fontSize: '10px', background: `${statusColor}15`, border: `1px solid ${statusColor}`, color: statusColor, padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                                  {app.status}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: '13px', color: '#ffffff' }}>@{app.author}</strong>
                                {app.autoAccepted && (
                                  <span style={{ fontSize: '10px', color: '#a855f7', fontWeight: '750' }}>⚡ Auto-Accepted</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Column: Dynamic Workflow Drawer, Peer reviews, Scheduler */}
                <div>
                  {activeAppId ? (() => {
                    const app = applicationsData.applications?.find(a => a.id === activeAppId);
                    if (!app) return null;

                    const statusColor = 
                      app.status === 'Approved' ? '#10b981' :
                      app.status === 'Denied' ? '#ef4444' :
                      app.status === 'Under Review' ? '#a855f7' : '#fbbf24';

                    return (
                      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {/* Drawer Header details */}
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>APP #{app.id} / @{app.author}</span>
                            <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '800' }}>{app.type}</h3>
                          </div>
                          
                          <span style={{ fontSize: '11px', background: `${statusColor}15`, border: `1px solid ${statusColor}`, color: statusColor, padding: '4px 10px', borderRadius: '4px', fontWeight: '800' }}>
                            Workflow Status: {app.status}
                          </span>
                        </div>

                        {/* Submission details key values */}
                        <div style={{ background: '#020617', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                          <strong style={{ color: '#c084fc', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>Submitted Details:</strong>
                          
                          {app.details.age && (
                            <div><span style={{ color: '#94a3b8' }}>Age:</span> <strong style={{ color: '#ffffff' }}>{app.details.age}</strong></div>
                          )}
                          {app.details.timezone && (
                            <div><span style={{ color: '#94a3b8' }}>Timezone:</span> <strong style={{ color: '#ffffff' }}>{app.details.timezone}</strong></div>
                          )}
                          {app.details.subscribers && (
                            <div><span style={{ color: '#94a3b8' }}>Subscribers Count:</span> <strong style={{ color: '#ffffff' }}>{app.details.subscribers}</strong></div>
                          )}
                          {app.details.channelUrl && (
                            <div><span style={{ color: '#94a3b8' }}>Channel URL:</span> <a href={`https://${app.details.channelUrl}`} target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '750' }}>{app.details.channelUrl}</a></div>
                          )}
                          {app.details.experience && (
                            <div style={{ marginTop: '4px' }}>
                              <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Staff Experience:</span>
                              <p style={{ margin: 0, color: '#cbd5e1', fontStyle: 'italic', background: 'rgba(255,255,255,0.01)', padding: '6px', borderRadius: '4px', borderLeft: '3px solid #3b82f6' }}>"{app.details.experience}"</p>
                            </div>
                          )}
                          {app.details.description && (
                            <div style={{ marginTop: '4px' }}>
                              <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Applicant Statement:</span>
                              <p style={{ margin: 0, color: '#cbd5e1', fontStyle: 'italic', background: 'rgba(255,255,255,0.01)', padding: '6px', borderRadius: '4px', borderLeft: '3px solid #c084fc' }}>"{app.details.description}"</p>
                            </div>
                          )}
                        </div>

                        {/* Approval workflow buttons (Staff Only) */}
                        {applicationsData.isStaff && (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              onClick={() => handleUpdateAppWorkflow('Under Review')}
                              style={{ flex: 1, background: 'rgba(168, 85, 247, 0.08)', border: '1px solid #a855f7', color: '#d8b4fe', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                            >
                              ⚙️ Under Review
                            </button>
                            <button
                              onClick={() => handleUpdateAppWorkflow('Approved')}
                              style={{ flex: 1, background: '#10b981', color: '#000000', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '850', cursor: 'pointer' }}
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => handleUpdateAppWorkflow('Denied')}
                              style={{ flex: 1, background: '#be123c', color: '#ffffff', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '850', cursor: 'pointer' }}
                            >
                              ❌ Deny
                            </button>
                          </div>
                        )}

                        {/* Interview Scheduler Calendar panel */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <strong style={{ fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📅 Interview Scheduler Panel</strong>
                          
                          {app.interviewTime ? (
                            <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Scheduled Appointment Date:</span>
                              <strong style={{ fontSize: '12.5px', color: '#93c5fd' }}>{new Date(app.interviewTime).toLocaleString()}</strong>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>No interview scheduled yet.</span>
                          )}

                          {applicationsData.isStaff && (
                            <form onSubmit={handleScheduleAppInterview} style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <input
                                type="datetime-local"
                                value={appInterviewTime}
                                onChange={(e) => setAppInterviewTime(e.target.value)}
                                style={{ flex: 1, background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                              />
                              <button
                                type="submit"
                                style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                              >
                                Book Schedule
                              </button>
                            </form>
                          )}
                        </div>

                        {/* Peer team reviews section */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <strong style={{ fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>👥 Peer Team Reviews ({app.reviews?.length || 0})</strong>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                            {app.reviews?.length === 0 ? (
                              <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>No review feedback submitted yet.</span>
                            ) : (
                              app.reviews?.map((rev, idx) => (
                                <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', fontSize: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <strong style={{ color: '#c084fc' }}>@{rev.reviewer}</strong>
                                    <span style={{ color: '#fbbf24', fontWeight: '800' }}>Score: {rev.score}/5 ★</span>
                                  </div>
                                  <span style={{ color: '#cbd5e1' }}>"{rev.comment}"</span>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Submit team review (Staff Only) */}
                          {applicationsData.isStaff && (
                            <form onSubmit={handlePostAppReview} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', marginTop: '4px' }}>
                              <strong style={{ fontSize: '10px', color: '#cbd5e1' }}>ADD FEEDBACK REVIEW Score & Comment</strong>
                              
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <label style={{ fontSize: '10px', color: '#94a3b8' }}>Review Score:</label>
                                <select
                                  value={appReviewScore}
                                  onChange={(e) => setAppReviewScore(parseInt(e.target.value))}
                                  style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px', fontSize: '11px' }}
                                >
                                  <option value="1">1 Star</option>
                                  <option value="2">2 Stars</option>
                                  <option value="3">3 Stars</option>
                                  <option value="4">4 Stars</option>
                                  <option value="5">5 Stars</option>
                                </select>
                              </div>

                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                  type="text"
                                  value={appReviewComment}
                                  onChange={(e) => setAppReviewComment(e.target.value)}
                                  placeholder="Write evaluation review comment details..."
                                  style={{ flex: 1, background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                                />
                                <button
                                  type="submit"
                                  style={{ background: '#c084fc', color: '#000000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '850', cursor: 'pointer' }}
                                >
                                  Review
                                </button>
                              </div>
                            </form>
                          )}
                        </div>

                      </div>
                    );
                  })() : (
                    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                      <span style={{ fontSize: '13px', color: '#cbd5e1', fontStyle: 'italic' }}>Select an application from the queue to view recruitment stages</span>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB: AUTOMATION */}
            {activeTab === 'automation' && loggedInUser && automationData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Row 1: Welcome & Goodbye Builders (Live Preview Box) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>👋 Welcome Message Builder</h3>
                    <textarea
                      value={welcomeBuilderInput}
                      onChange={(e) => setWelcomeBuilderInput(e.target.value)}
                      placeholder="Welcome to the server, {user}!"
                      rows={3}
                      style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px', fontSize: '12.5px', resize: 'none' }}
                    />
                    <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Welcome Live Preview:</span>
                      <p style={{ margin: 0, fontSize: '12px', color: '#a7f3d0', fontStyle: 'italic' }}>
                        {welcomeBuilderInput.replace('{user}', `@${loggedInCharName}`)}
                      </p>
                    </div>
                  </div>

                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🚪 Goodbye Message Builder</h3>
                    <textarea
                      value={goodbyeBuilderInput}
                      onChange={(e) => setGoodbyeBuilderInput(e.target.value)}
                      placeholder="Goodbye {user}, see you next time!"
                      rows={3}
                      style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px', fontSize: '12.5px', resize: 'none' }}
                    />
                    <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Goodbye Live Preview:</span>
                      <p style={{ margin: 0, fontSize: '12px', color: '#fca5a5', fontStyle: 'italic' }}>
                        {goodbyeBuilderInput.replace('{user}', `@${loggedInCharName}`)}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleUpdateGeneralAutomations}
                    style={{ background: '#c084fc', color: '#000000', border: 'none', padding: '10px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: '850', cursor: 'pointer' }}
                  >
                    Save General Builder Settings
                  </button>
                </div>

                {/* Row 2: Auto Roles & Auto Threads */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
                  
                  {/* Auto Roles Panel */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🏷️ Auto Role Assignment</h3>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#cbd5e1' }}>Roles automatically assigned to new users upon portal login:</p>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {automationData.autoRoles?.map(role => (
                        <span key={role} style={{ fontSize: '11px', background: 'rgba(192, 132, 252, 0.1)', border: '1px solid rgba(192, 132, 252, 0.3)', color: '#d8b4fe', padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {role}
                          <button onClick={() => handleRemoveAutoRole(role)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: '11px', fontWeight: '800' }}>×</button>
                        </span>
                      ))}
                    </div>

                    <form onSubmit={handleAddAutoRole} style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="text"
                        value={autoRoleInput}
                        onChange={(e) => setAutoRoleInput(e.target.value)}
                        placeholder="e.g. Newbie Adventurer"
                        style={{ flex: 1, background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                      />
                      <button type="submit" style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>Add Role</button>
                    </form>
                  </div>

                  {/* Auto Threads trigger lists */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>⛓️ Auto Threads Rules</h3>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#cbd5e1' }}>Automatically open a support/discussion thread when messages are posted in target channels:</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {automationData.autoThreads?.map((thr, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                          <div>
                            <span style={{ color: '#cbd5e1' }}>Trigger Channel: </span>
                            <strong style={{ color: '#ffffff' }}>{thr.triggerChannel}</strong>
                          </div>
                          <div>
                            <span style={{ color: '#cbd5e1' }}>Thread Title: </span>
                            <strong style={{ color: '#a855f7' }}>{thr.threadName}</strong>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddAutoThread} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr auto', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="text"
                        value={autoThreadChannelInput}
                        onChange={(e) => setAutoThreadChannelInput(e.target.value)}
                        placeholder="e.g. #trading-post"
                        style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        value={autoThreadNameInput}
                        onChange={(e) => setAutoThreadNameInput(e.target.value)}
                        placeholder="Thread Topic (e.g. Ad details)"
                        style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                      />
                      <button type="submit" style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>Create Rule</button>
                    </form>
                  </div>
                </div>

                {/* Row 3: Reaction Roles & Button Roles Configurations */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  
                  {/* Reaction Roles */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🎭 Reaction Roles Binding</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {automationData.reactionRoles?.map((rr, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                          <span style={{ fontSize: '14px' }}>{rr.emoji}</span>
                          <div>
                            <span style={{ color: '#cbd5e1' }}>Grants Role: </span>
                            <strong style={{ color: '#ffffff' }}>{rr.role}</strong>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddReactionRole} style={{ display: 'grid', gridTemplateColumns: '80px 1.5fr auto', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="text"
                        value={newReactEmoji}
                        onChange={(e) => setNewReactEmoji(e.target.value)}
                        placeholder="Emoji (⚔️)"
                        style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px', textAlign: 'center' }}
                      />
                      <input
                        type="text"
                        value={newReactRole}
                        onChange={(e) => setNewReactRole(e.target.value)}
                        placeholder="Target Role (e.g. PVP Fighter)"
                        style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                      />
                      <button type="submit" style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>Bind</button>
                    </form>
                  </div>

                  {/* Button Roles */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🔘 Button Roles configuration</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {automationData.buttonRoles?.map((br, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                          <span style={{ fontSize: '11px', background: '#3b82f6', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontWeight: '800' }}>
                            {br.label}
                          </span>
                          <div>
                            <span style={{ color: '#cbd5e1' }}>Grants Role: </span>
                            <strong style={{ color: '#ffffff' }}>{br.role}</strong>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddButtonRole} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr auto', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="text"
                        value={newBtnLabel}
                        onChange={(e) => setNewBtnLabel(e.target.value)}
                        placeholder="Button Text Label"
                        style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        value={newBtnRole}
                        onChange={(e) => setNewBtnRole(e.target.value)}
                        placeholder="Target Role (e.g. News Alert)"
                        style={{ background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                      />
                      <button type="submit" style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>Bind</button>
                    </form>
                  </div>
                </div>

                {/* Row 4: Scheduled Messages, Reminders & Auto Archive Limits */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px' }}>
                  
                  {/* Scheduled Messages Panel */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>📢 Scheduled Bulletins & Announcements</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                      {automationData.scheduledMessages?.map(msg => (
                        <div key={msg.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '10px', color: '#a855f7', fontWeight: '800', display: 'block' }}>{msg.time} @ {msg.channel}</span>
                            <span style={{ color: '#ffffff' }}>"{msg.content}"</span>
                          </div>
                          <button onClick={() => handleDeleteSchedMsg(msg.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', fontWeight: '750' }}>Delete</button>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleCreateSchedMsg} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Interval (e.g. Daily 00:00)</label>
                        <input
                          type="text"
                          value={schedMsgTime}
                          onChange={(e) => setSchedMsgTime(e.target.value)}
                          placeholder="Daily 12:00"
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Target Channel</label>
                        <input
                          type="text"
                          value={schedMsgChannel}
                          onChange={(e) => setSchedMsgChannel(e.target.value)}
                          placeholder="#general-chat"
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                        />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Announcement Message Content</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            value={schedMsgContent}
                            onChange={(e) => setSchedMsgContent(e.target.value)}
                            placeholder="Write message bulletins here..."
                            style={{ flex: 1, background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                          />
                          <button type="submit" style={{ background: '#c084fc', color: '#000000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '850', cursor: 'pointer' }}>Schedule</button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* One-off reminder & Auto archive hours */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Auto Archive hours */}
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>⏱️ Auto-Archive Timer</h3>
                      <label style={{ fontSize: '10px', color: '#cbd5e1' }}>Archive inactive support threads after (hours):</label>
                      <select
                        value={autoArchiveHoursInput}
                        onChange={(e) => setAutoArchiveHoursInput(parseInt(e.target.value))}
                        style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12.5px' }}
                      >
                        <option value="1">1 Hour</option>
                        <option value="6">6 Hours</option>
                        <option value="12">12 Hours</option>
                        <option value="24">24 Hours (1 Day)</option>
                        <option value="48">48 Hours (2 Days)</option>
                        <option value="72">72 Hours (3 Days)</option>
                      </select>
                    </div>

                    {/* One-off Reminders queue */}
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>⏰ Reminder Scheduler</h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {automationData.reminders?.map((rem, idx) => (
                          <div key={idx} style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px' }}>
                            <span style={{ color: '#cbd5e1', display: 'block', fontSize: '10px' }}>{new Date(rem.time).toLocaleString()}</span>
                            <strong style={{ color: '#ffffff' }}>{rem.content}</strong>
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleCreateReminder} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                        <input
                          type="datetime-local"
                          value={reminderTimeInput}
                          onChange={(e) => setReminderTimeInput(e.target.value)}
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                        />
                        <input
                          type="text"
                          value={reminderContentInput}
                          onChange={(e) => setReminderContentInput(e.target.value)}
                          placeholder="Reminder note..."
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                        />
                        <button type="submit" style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>
                          Add Reminder Alert
                        </button>
                      </form>
                    </div>

                  </div>

                </div>

                {/* Row 5: Custom workflows node builder board */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>⛓️ Custom Server Workflows triggers</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                    {automationData.customWorkflows?.map((wf, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '13px', color: '#ffffff' }}>{wf.name}</strong>
                          <span style={{ fontSize: '9px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                            {wf.status}
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Trigger script binds:</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#cbd5e1', fontStyle: 'italic' }}>"{wf.triggers}"</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleCreateWorkflow} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Workflow Name</label>
                      <input
                        type="text"
                        value={workflowNameInput}
                        onChange={(e) => setWorkflowNameInput(e.target.value)}
                        placeholder="e.g. Adopt Pet notify"
                        style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Trigger Action (e.g. IF adopted pet, THEN send announcement)</label>
                      <input
                        type="text"
                        value={workflowTriggerInput}
                        onChange={(e) => setWorkflowTriggerInput(e.target.value)}
                        placeholder="e.g. IF adoption THEN log to #pet-alerts"
                        style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button type="submit" style={{ background: '#c084fc', color: '#000000', border: 'none', padding: '10px 24px', borderRadius: '6px', fontSize: '12.5px', fontWeight: '850', cursor: 'pointer' }}>
                        Register Workflow
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            )}

            {/* TAB: PREMIUM OS */}
            {activeTab === 'premium_os' && loggedInUser && premiumOSData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Premium Banner & Cross-Server Sync */}
                <div className="glass-card glow-violet" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#ffffff' }} className="text-gradient-purple">👑 Discord Bot OS Premium Control</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>Cross-server profiles, dynamic achievement rules, developer integrations, and optional modules</p>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textRight: 'right' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Cross-Server Profile Syncing</span>
                      <strong style={{ fontSize: '13px', color: '#10b981' }}>{premiumOSData.crossServerSync ? 'ENABLED (Global)' : 'DISABLED'}</strong>
                    </div>
                    <button
                      onClick={handleTriggerOSBackup}
                      style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      💾 Create Backup
                    </button>
                  </div>
                </div>

                {/* 🧩 Plugin Marketplace OS Module installer */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>🧩 Plugin App Marketplace</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>Install or uninstall modular features. Active tabs will mount/unmount dynamically in the header navigation menu.</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {[
                      { name: 'Dungeons', desc: 'Dungeon battles, HP/Mana management, loot levels.', icon: '⚔️' },
                      { name: 'Casino', desc: 'Slots games, progressive jackpots, wheel spins.', icon: '🎡' },
                      { name: 'AI Hub', desc: 'Rule base text query answering & summaries.', icon: '🤖' },
                      { name: 'Analytics', desc: 'Engagement activity heatmap & voice analytics.', icon: '📊' },
                      { name: 'Support Tickets', desc: 'Auto assignment staff notes, priorities, ratings.', icon: '🎟️' }
                    ].map(plugin => {
                      const installed = premiumOSData.installedPlugins?.includes(plugin.name);
                      return (
                        <div
                          key={plugin.name}
                          style={{
                            background: installed ? 'rgba(192, 132, 252, 0.04)' : '#090d16',
                            border: `1px solid ${installed ? 'rgba(192, 132, 252, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: '10px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '24px' }}>{plugin.icon}</span>
                              <span style={{ fontSize: '9px', background: installed ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: installed ? '#10b981' : '#cbd5e1', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                                {installed ? 'INSTALLED' : 'OFFLINE'}
                              </span>
                            </div>
                            <strong style={{ fontSize: '13px', color: '#ffffff', display: 'block' }}>{plugin.name} Plugin</strong>
                            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#cbd5e1', lineHeight: '1.3' }}>{plugin.desc}</p>
                          </div>

                          <button
                            onClick={() => handleToggleOSPlugin(plugin.name)}
                            style={{
                              width: '100%',
                              background: installed ? '#be123c' : '#c084fc',
                              color: installed ? '#ffffff' : '#000000',
                              border: 'none',
                              padding: '6px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '850',
                              cursor: 'pointer'
                            }}
                          >
                            {installed ? 'Uninstall Module' : 'Install Module'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Achievements & Seasonal Events */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                  
                  {/* Dynamic Achievement Engine */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🏅 Custom Dynamic Achievement Engine</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>Construct server achievements and award custom badges automatically:</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                      {premiumOSData.dynamicAchievements?.map(ach => (
                        <div key={ach.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', fontSize: '11.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ color: '#ffffff' }}>{ach.name}</strong>
                            <span style={{ color: '#cbd5e1', display: 'block', fontSize: '10px' }}>Criteria: {ach.criteria}</span>
                          </div>
                          <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: '750' }}>Reward: {ach.reward}</span>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleCreateOSAchievement} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                      <div>
                        <input
                          type="text"
                          value={achNameInput}
                          onChange={(e) => setAchNameInput(e.target.value)}
                          placeholder="Achievement Name"
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px', fontSize: '11.5px' }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={achCriteriaInput}
                          onChange={(e) => setAchCriteriaInput(e.target.value)}
                          placeholder="Criteria Condition (e.g. 500 msgs)"
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px', fontSize: '11.5px' }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={achRewardInput}
                          onChange={(e) => setAchRewardInput(e.target.value)}
                          placeholder="Reward (e.g. 🍒 250)"
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px', fontSize: '11.5px' }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={achBadgeInput}
                          onChange={(e) => setAchBadgeInput(e.target.value)}
                          placeholder="Badge Medal Name"
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px', fontSize: '11.5px' }}
                        />
                      </div>
                      <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '6px 16px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}>
                          Add Achievement
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Seasonal Events Manager */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🎉 Seasonal Event Manager</h3>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#cbd5e1' }}>Set active holiday themes and special quest announcements:</p>
                    
                    <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '10px', borderRadius: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Active Holiday Theme:</span>
                      <strong style={{ fontSize: '13px', color: '#fbbf24' }}>{premiumOSData.seasonalEvent || 'None Loaded'}</strong>
                    </div>

                    <form onSubmit={handleSetOSSeasonalEvent} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={seasonalEventInput}
                        onChange={(e) => setSeasonalEventInput(e.target.value)}
                        placeholder="e.g. Halloween Hunt Event"
                        style={{ flex: 1, background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                      />
                      <button type="submit" style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>Apply Event</button>
                    </form>
                  </div>

                </div>

                {/* Row 4: Quizzes Builder & Certification taking */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
                  
                  {/* Create course quiz */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🎓 Course & Certification Builder</h3>
                    <form onSubmit={handleCreateOSQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: '#cbd5e1' }}>Course Title</label>
                        <input
                          type="text"
                          value={quizTitleInput}
                          onChange={(e) => setQuizTitleInput(e.target.value)}
                          placeholder="e.g. Mod Training Course"
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px', fontSize: '11.5px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: '#cbd5e1' }}>Question</label>
                        <input
                          type="text"
                          value={quizQuestionInput}
                          onChange={(e) => setQuizQuestionInput(e.target.value)}
                          placeholder="e.g. What is the penalty for spamming?"
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px', fontSize: '11.5px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: '#cbd5e1' }}>Options List (Comma separated)</label>
                        <input
                          type="text"
                          value={quizOptionsInput}
                          onChange={(e) => setQuizOptionsInput(e.target.value)}
                          placeholder="Option A, Option B, Option C, Option D"
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px', fontSize: '11.5px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: '#cbd5e1' }}>Correct Option Value</label>
                        <input
                          type="text"
                          value={quizCorrectInput}
                          onChange={(e) => setQuizCorrectInput(e.target.value)}
                          placeholder="Option A"
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px', fontSize: '11.5px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: '#cbd5e1' }}>Certificate Badge Earned</label>
                        <input
                          type="text"
                          value={quizBadgeInput}
                          onChange={(e) => setQuizBadgeInput(e.target.value)}
                          placeholder="e.g. Certified Moderator"
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px', fontSize: '11.5px' }}
                        />
                      </div>
                      <button type="submit" style={{ background: '#c084fc', color: '#000000', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '850', cursor: 'pointer' }}>
                        Register Course Quiz
                      </button>
                    </form>
                  </div>

                  {/* Active Quizzes to Take */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🎓 Available Certification Courses</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {premiumOSData.quizzes?.map(q => (
                        <div key={q.id} style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '16px' }}>
                          <span style={{ fontSize: '9px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                            REWARD: "{q.certificateBadge}" Profile Badge
                          </span>
                          <strong style={{ fontSize: '14px', color: '#ffffff', display: 'block', margin: '6px 0' }}>{q.title}</strong>
                          <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: '#cbd5e1' }}>Question: {q.questions[0].question}</p>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                            {q.questions[0].options?.map(opt => (
                              <button
                                key={opt}
                                onClick={() => handleTakeOSQuiz(q, opt)}
                                style={{
                                  background: 'rgba(255,255,255,0.02)',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  borderRadius: '6px',
                                  padding: '8px',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  textAlign: 'left'
                                }}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Row 5: Community Health Dashboard & Developer APIs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px' }}>
                  
                  {/* Community Health Score */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🩺 Community Health Dashboard</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', textAlign: 'center' }}>
                      <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '14px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Member Activity</span>
                        <strong style={{ fontSize: '18px', color: '#10b981' }}>94% Active</strong>
                        <span style={{ fontSize: '8.5px', color: '#10b981', display: 'block', marginTop: '2px' }}>Excellent engagement</span>
                      </div>
                      <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '14px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Mod Response Time</span>
                        <strong style={{ fontSize: '18px', color: '#10b981' }}>12.4 mins</strong>
                        <span style={{ fontSize: '8.5px', color: '#10b981', display: 'block', marginTop: '2px' }}>Fast ticket resolution</span>
                      </div>
                      <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '14px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Member Retention</span>
                        <strong style={{ fontSize: '18px', color: '#fbbf24' }}>85.2% Weekly</strong>
                        <span style={{ fontSize: '8.5px', color: '#fbbf24', display: 'block', marginTop: '2px' }}>Up 2.4% from last week</span>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '14px', borderRadius: '10px', fontSize: '12px' }}>
                      <strong style={{ color: '#60a5fa', display: 'block', marginBottom: '4px' }}>💡 OS System Recommendations:</strong>
                      <ul style={{ margin: 0, paddingLeft: '16px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <li>Support ticket load spikes on Saturdays. Consider adding Mod3 to the rotational auto-assignment queue.</li>
                        <li>Homestead adopts are up by 25%. Creating a community harvest goal will boost core retention!</li>
                      </ul>
                    </div>
                  </div>

                  {/* Dev API Bearer Token Generator */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🔌 Developer Public API Center</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>Issue secure bearer API keys to integrate custom analytics or external discord dashboards:</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {premiumOSData.developerApiTokens?.map((token, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10.5px', color: '#a855f7', wordBreak: 'break-all' }}>
                          Bearer {token.substring(0, 16)}...
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleGenerateOSDevToken}
                      style={{ background: '#c084fc', color: '#000000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '850', cursor: 'pointer', marginTop: '6px' }}
                    >
                      🔑 Generate Dev Token
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* TAB: MUSIC */}
            {activeTab === 'music' && loggedInUser && musicState && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Upper row: Rich Now-Playing Player Card & Lyrics Pane */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                  
                  {/* Glowing Live Music Player Console */}
                  <div
                    className="glass-card glow-violet"
                    style={{
                      position: 'relative',
                      borderRadius: '16px',
                      padding: '24px',
                      background: 'linear-gradient(135deg, rgba(30,27,75,0.7), rgba(9,9,11,0.9))',
                      border: '1px solid rgba(192, 132, 252, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}
                  >
                    {/* Floating Status Indicator */}
                    <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: musicState.nowPlaying.paused ? '#fbbf24' : '#10b981', boxShadow: '0 0 10px currentColor' }} />
                      <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {musicState.nowPlaying.paused ? 'Paused' : 'Playing Live'}
                      </span>
                    </div>

                    <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: '750', color: '#ffffff' }}>
                      🔁 Loop: {musicState.nowPlaying.loopMode}
                    </div>

                    {/* Album Art Cover */}
                    <img
                      src={musicState.nowPlaying.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4'}
                      style={{ width: '130px', height: '130px', borderRadius: '12px', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', marginTop: '12px' }}
                      alt=""
                    />

                    <div>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#ffffff' }}>{musicState.nowPlaying.title}</h2>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#c084fc', fontWeight: '700' }}>by {musicState.nowPlaying.artist}</p>
                    </div>

                    {/* Progress Bar & Durations */}
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#cbd5e1' }}>
                        <span>{Math.floor(musicState.nowPlaying.position / 60)}:{(musicState.nowPlaying.position % 60).toString().padStart(2, '0')}</span>
                        <span>{Math.floor(musicState.nowPlaying.duration / 60)}:{(musicState.nowPlaying.duration % 60).toString().padStart(2, '0')}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={musicState.nowPlaying.duration}
                        value={musicState.nowPlaying.position}
                        onChange={(e) => handleMusicControl('seek', e.target.value)}
                        style={{ width: '100%', accentColor: '#c084fc', cursor: 'pointer', height: '4px' }}
                      />
                    </div>

                    {/* Waveform Visualization */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '24px', margin: '4px 0' }}>
                      {[12, 18, 8, 22, 14, 18, 10, 24, 16, 20, 6, 14, 22, 10, 18].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            width: '4px',
                            height: musicState.nowPlaying.paused ? '4px' : `${h}px`,
                            background: 'linear-gradient(to top, #6366f1, #c084fc)',
                            borderRadius: '2px',
                            transition: 'height 0.25s ease-in-out'
                          }}
                        />
                      ))}
                    </div>

                    {/* Media Controls Layout */}
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'center' }}>
                      <button onClick={() => handleMusicControl('loop', 'Track')} title="Loop Track" style={{ background: musicState.nowPlaying.loopMode === 'Track' ? '#c084fc' : 'transparent', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>🔂</button>
                      <button onClick={() => handleMusicControl('stop')} title="Stop Playback" style={{ background: 'transparent', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⏹️</button>
                      <button
                        onClick={() => handleMusicControl(musicState.nowPlaying.paused ? 'resume' : 'pause')}
                        style={{ background: '#ffffff', color: '#090d16', border: 'none', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 4px 15px rgba(255,255,255,0.2)' }}
                      >
                        {musicState.nowPlaying.paused ? '▶️' : '⏸️'}
                      </button>
                      <button onClick={() => handleMusicControl('skip')} title="Skip Track" style={{ background: 'transparent', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⏭️</button>
                      <button onClick={() => handleMusicControl('loop', 'None')} title="Clear Loop" style={{ background: 'transparent', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>🚫</button>
                    </div>

                    {/* Volume range slider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '60%', marginTop: '6px' }}>
                      <span style={{ fontSize: '12px' }}>🔊</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={musicState.nowPlaying.volume}
                        onChange={(e) => handleMusicControl('volume', e.target.value)}
                        style={{ flex: 1, accentColor: '#c084fc', cursor: 'pointer', height: '3px' }}
                      />
                      <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: '800' }}>{musicState.nowPlaying.volume}%</span>
                    </div>

                  </div>

                  {/* Collapsible Lyrics Panel */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>📜 Dynamic Live Lyrics</h3>
                    <div
                      style={{
                        background: '#090d16',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '10px',
                        padding: '16px',
                        flex: 1,
                        overflowY: 'auto',
                        whiteSpace: 'pre-line',
                        fontStyle: 'italic',
                        color: '#cbd5e1',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        textAlign: 'center'
                      }}
                    >
                      {musicState.nowPlaying.lyrics}
                    </div>
                  </div>

                </div>

                {/* Second row: Audio Filter EQ Board & Trivia lounge */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px' }}>
                  
                  {/* EQ & Audio Filters Mixer Board */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🎚️ Equalizer & Audio Filters Mixer</h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>Combine multiple filters and modify speed/pitch configurations in real-time:</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                      {[
                        { key: 'bassBoost', label: 'Bass Boost 🎸' },
                        { key: 'nightcore', label: 'Nightcore ⚡' },
                        { key: 'vaporwave', label: 'Vaporwave 💫' },
                        { key: 'eightD', label: '8D Audio 🎧' },
                        { key: 'karaoke', label: 'Karaoke 🎤' }
                      ].map(filter => {
                        const active = musicState.filters[filter.key];
                        return (
                          <button
                            key={filter.key}
                            onClick={() => handleMusicFilterUpdate(filter.key, !active)}
                            style={{
                              background: active ? 'rgba(192, 132, 252, 0.15)' : '#090d16',
                              border: `1px solid ${active ? '#c084fc' : 'rgba(255,255,255,0.08)'}`,
                              color: active ? '#d8b4fe' : '#cbd5e1',
                              padding: '10px 4px',
                              borderRadius: '8px',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              fontWeight: '750'
                            }}
                          >
                            {filter.label}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Speed Multiplier ({musicState.filters.speed}x)</label>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={musicState.filters.speed}
                          onChange={(e) => handleMusicFilterUpdate('speed', false, e.target.value)}
                          style={{ width: '100%', accentColor: '#c084fc', cursor: 'pointer' }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ fontSize: '10px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Pitch Level ({musicState.filters.pitch}x)</label>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={musicState.filters.pitch}
                          onChange={(e) => handleMusicFilterUpdate('pitch', false, e.target.value)}
                          style={{ width: '100%', accentColor: '#c084fc', cursor: 'pointer' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Studio Reverb ({musicState.filters.reverbLevel}%)</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={musicState.filters.reverbLevel}
                          onChange={(e) => handleMusicFilterUpdate('reverb', false, e.target.value)}
                          style={{ width: '100%', accentColor: '#c084fc', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Trivia quiz lounge */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🎮 Live Party Music Trivia</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>Test your music knowledge while listening to the server radio:</p>
                    
                    <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px' }}>
                      <strong style={{ fontSize: '12px', color: '#ffffff', display: 'block', marginBottom: '8px' }}>
                        Q: {musicState.trivia.question}
                      </strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {musicState.trivia.options?.map(opt => (
                          <button
                            key={opt}
                            onClick={() => {
                              if (opt === musicState.trivia.correct) {
                                alert('🎉 Correct answer! +50 Cherry Coins credited!');
                              } else {
                                alert('❌ Wrong answer. Keep listening and try the next query!');
                              }
                            }}
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', color: '#cbd5e1', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left' }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Third Row: Queue list, swaps, and queue additions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: '24px' }}>
                  
                  {/* Interactive Playback Queue */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>📋 Collaborative Playback Queue</h3>
                      <button
                        onClick={() => handleMusicQueueEdit('clear')}
                        style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '11.5px', cursor: 'pointer', fontWeight: '800' }}
                      >
                        Clear Queue
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                      {musicState.queue?.map((song, idx) => (
                        <div key={song.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                          <div>
                            <span style={{ color: '#94a3b8', marginRight: '6px' }}>#{idx + 1}</span>
                            <strong style={{ color: '#ffffff' }}>{song.title}</strong>
                            <span style={{ color: '#cbd5e1', display: 'block', fontSize: '10px' }}>by {song.artist} • Req by {song.requestedBy}</span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#94a3b8', fontSize: '11px' }}>{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</span>
                            <button
                              onClick={() => handleMusicQueueEdit('remove', { id: song.id })}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Swap Reorder inputs */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Reorder Queue position: Swap index</span>
                      <input
                        type="number"
                        min="0"
                        value={musicSwapIndex1}
                        onChange={(e) => setMusicSwapIndex1(e.target.value)}
                        style={{ width: '50px', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px', fontSize: '11.5px' }}
                      />
                      <span style={{ fontSize: '11px', color: '#cbd5e1' }}>with</span>
                      <input
                        type="number"
                        min="0"
                        value={musicSwapIndex2}
                        onChange={(e) => setMusicSwapIndex2(e.target.value)}
                        style={{ width: '50px', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px', fontSize: '11.5px' }}
                      />
                      <button
                        onClick={() => handleMusicQueueEdit('swap', { swapIndex1: musicSwapIndex1, swapIndex2: musicSwapIndex2 })}
                        style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer', fontWeight: '800' }}
                      >
                        Swap
                      </button>
                    </div>
                  </div>

                  {/* Add song to queue & Playlist manager */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🎵 Search & Add New Song</h3>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={musicAddTitle}
                        onChange={(e) => setMusicAddTitle(e.target.value)}
                        placeholder="Song Title"
                        style={{ flex: 1, background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        value={musicAddArtist}
                        onChange={(e) => setMusicAddArtist(e.target.value)}
                        placeholder="Artist"
                        style={{ flex: 1, background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                      />
                      <button
                        onClick={() => {
                          if (musicAddTitle.trim()) {
                            handleMusicQueueEdit('add', { songTitle: musicAddTitle, songArtist: musicAddArtist });
                            setMusicAddTitle('');
                            setMusicAddArtist('');
                          }
                        }}
                        style={{ background: '#c084fc', color: '#000000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '850', cursor: 'pointer' }}
                      >
                        Add to Queue
                      </button>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '6px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#ffffff' }}>📂 Save Current Playback Playlist</h4>
                      <form onSubmit={handleCreateMusicPlaylist} style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={musicPlaylistInput}
                          onChange={(e) => setMusicPlaylistInput(e.target.value)}
                          placeholder="Playlist name..."
                          style={{ flex: 1, background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                        />
                        <button type="submit" style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>
                          Save Playlist
                        </button>
                      </form>
                    </div>

                  </div>

                </div>

                {/* Fourth Row: Playlists library & Analytics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
                  
                  {/* Saved Playlists list */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>📂 Playlists Library</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {musicState.playlists?.map((pl, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '13px', color: '#ffffff', display: 'block' }}>{pl.name}</strong>
                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Created by {pl.owner} • {pl.collaborative ? 'Collaborative' : 'Private'}</span>
                          </div>
                          <span style={{ fontSize: '11px', background: 'rgba(192, 132, 252, 0.1)', color: '#c084fc', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>
                            {pl.songsCount} Songs
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Analytics details */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>📊 Music Studio Analytics</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Most Played Songs:</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                          {musicState.analytics.mostPlayedSongs?.map((song, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: '#cbd5e1' }}>{i + 1}. {song.title}</span>
                              <span style={{ color: '#c084fc', fontWeight: '750' }}>{song.plays} Plays</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '10px', color: '#c084fc', textTransform: 'uppercase', fontWeight: '800' }}>Radio Stats:</span>
                        <div style={{ fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>Total Hours Listened:</span> <strong style={{ color: '#ffffff' }}>{musicState.analytics.totalHoursListened} hrs</strong>
                        </div>
                        <div style={{ fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>Peak Listening Hours:</span> <strong style={{ color: '#ffffff' }}>{musicState.analytics.peakListeningHours}</strong>
                        </div>
                        <div style={{ fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>Top Listener:</span> <strong style={{ color: '#10b981' }}>{musicState.analytics.mostActiveListeners?.[0]?.name}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB: INVENTORY */}
            {activeTab === 'inventory' && loggedInUser && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Your Visual Adventurer Bag</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Equip weapons/shields and view all acquired items</p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                    <span style={{ color: '#10b981', fontWeight: '700' }}>⚔️ Weapon: {equippedWeapon || 'None'}</span>
                    <span style={{ color: '#3b82f6', fontWeight: '700' }}>🛡️ Shield: {equippedShield || 'None'}</span>
                  </div>
                </div>

                <div className="inventory-grid">
                  {myInventory.map((item, idx) => {
                    const isWeapon = item.itemName.toLowerCase().includes('sword') || item.itemName.toLowerCase().includes('bow') || item.itemName.toLowerCase().includes('staff');
                    const isShield = item.itemName.toLowerCase().includes('shield') || item.itemName.toLowerCase().includes('ring');
                    const isEquippable = isWeapon || isShield;
                    const slot = isWeapon ? 'weapon' : 'shield';

                    return (
                      <div key={idx} className="inventory-slot">
                        <div className="item-qty-badge">x{item.quantity}</div>
                        <span style={{ fontSize: '32px' }}>
                          {item.itemName.toLowerCase().includes('stone') || item.itemName.toLowerCase().includes('ore') ? '🪨' :
                           item.itemName.toLowerCase().includes('wood') || item.itemName.toLowerCase().includes('twig') ? '🪵' :
                           item.itemName.toLowerCase().includes('potion') ? '🧪' :
                           item.itemName.toLowerCase().includes('sword') ? '⚔️' :
                           item.itemName.toLowerCase().includes('shield') ? '🛡️' :
                           item.itemName.toLowerCase().includes('seed') ? '🌱' : '🍎'}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: '750', color: '#ffffff', textAlign: 'center' }}>{item.itemName}</span>
                        {isEquippable && (
                          <button
                            onClick={() => handleEquipItem(item.itemName, slot)}
                            style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid rgba(139,92,246,0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer', marginTop: '4px' }}
                          >
                            Equip
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {myInventory.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <p style={{ margin: 0, fontStyle: 'italic' }}>Your inventory is empty.</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Mine, fish, or chop wood to fill your bag!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: SHOP */}
            {activeTab === 'shop' && loggedInUser && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Boutique Shop</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Purchase consumables, materials, and seeds using your cherries</p>
                  </div>
                  <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                    Wallet Balance: 🍒 {myCharacter?.coins?.toLocaleString()} cherries
                  </span>
                </div>

                <div className="shop-grid">
                  {shopCatalog.map((item, idx) => (
                    <div key={idx} className="shop-card">
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '32px' }}>{item.emoji}</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>{item.name}</h4>
                          <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>{item.category}</span>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>{item.desc}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                        <span style={{ fontWeight: '800', color: '#fbbf24', fontSize: '14px' }}>🍒 {item.price}</span>
                        <button
                          onClick={() => handleBuyShopItem(item.id)}
                          style={{ background: '#fbbf24', color: '#000000', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '750', cursor: 'pointer' }}
                        >
                          Buy Item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && loggedInUser && myCharacter && profileData && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
                
                {/* Left Column: Customized Animated Rank Card & Profile settings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* High-Fidelity Animated Rank Card */}
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: '16px',
                      padding: '24px',
                      overflow: 'hidden',
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.85)), url(${customBgInput || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: selectedTheme === 'Cyberpunk Neon' ? '0 0 20px rgba(236, 72, 153, 0.4)' : 
                               selectedTheme === 'Emerald Forest' ? '0 0 20px rgba(16, 185, 129, 0.4)' : 
                               selectedTheme === 'Sunset Spark' ? '0 0 20px rgba(245, 158, 11, 0.4)' : 
                               '0 0 20px rgba(139, 92, 246, 0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}
                  >
                    {/* Floating Rank Badge */}
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: '800', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {myCharacter.level >= 20 ? '🏆 Mythic Tier' :
                       myCharacter.level >= 11 ? '⭐ Gold Tier' :
                       myCharacter.level >= 6 ? '🛡️ Silver Tier' : '🤝 Bronze Tier'}
                    </div>

                    <img src={myCharacter.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #ffffff', boxShadow: '0 0 15px rgba(255,255,255,0.2)' }} alt="" />
                    
                    <div>
                      {activeTitleInput && (
                        <span style={{ fontSize: '10px', color: '#c084fc', textTransform: 'uppercase', fontWeight: '850', letterSpacing: '1px', display: 'block', marginBottom: '2px' }}>
                          [{activeTitleInput}]
                        </span>
                      )}
                      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>{myCharacter.charName}</h2>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                        Lvl {myCharacter.level} {myCharacter.race} {myCharacter.class}
                      </p>
                    </div>

                    {/* Progress XP Bar */}
                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                        <span>EXP PROGRESS</span>
                        <span>{myCharacter.xp} XP / {myCharacter.level * 100} XP</span>
                      </div>
                      <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${(myCharacter.xp / (myCharacter.level * 100)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #c084fc 0%, #6366f1 100%)' }} />
                      </div>
                    </div>

                    {/* Wearable Badges row */}
                    {selectedBadges.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
                        {selectedBadges.map(badge => (
                          <span key={badge} style={{ fontSize: '9px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: '750' }}>
                            🏅 {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Customize profile form */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>🎨 Theme & Card Customizer</h3>
                    
                    <form onSubmit={handleUpdateProfileCustomizations} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Card Theme skin</label>
                          <select
                            value={selectedTheme}
                            onChange={(e) => {
                              setSelectedTheme(e.target.value);
                              if (profileData?.themeBackgrounds?.[e.target.value]) {
                                setCustomBgInput(profileData.themeBackgrounds[e.target.value]);
                              }
                            }}
                            style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                          >
                            {profileData.availableThemes?.map(theme => (
                              <option key={theme} value={theme}>{theme}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Active Title</label>
                          <select
                            value={activeTitleInput}
                            onChange={(e) => setActiveTitleInput(e.target.value)}
                            style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                          >
                            {profileData.availableTitles?.map(title => (
                              <option key={title} value={title}>{title}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Custom Background Wallpaper URL</label>
                        <input
                          type="text"
                          value={customBgInput}
                          onChange={(e) => setCustomBgInput(e.target.value)}
                          placeholder="Paste image URL (e.g. unsplash.com/...)"
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Custom Biography (About Me)</label>
                        <textarea
                          value={bioInput}
                          onChange={(e) => setBioInput(e.target.value)}
                          placeholder="Tell adventurers about yourself..."
                          rows={2}
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px', resize: 'none' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Favorite Games (Comma separated)</label>
                        <input
                          type="text"
                          value={favGamesInput}
                          onChange={(e) => setFavGamesInput(e.target.value)}
                          placeholder="e.g. Cherry RPG, Elden Ring, Minecraft"
                          style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Discord handle</label>
                          <input
                            type="text"
                            value={socialDiscordInput}
                            onChange={(e) => setSocialDiscordInput(e.target.value)}
                            placeholder="e.g. bob#1234"
                            style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Twitter/X handle</label>
                          <input
                            type="text"
                            value={socialTwitterInput}
                            onChange={(e) => setSocialTwitterInput(e.target.value)}
                            placeholder="e.g. @bob_tweets"
                            style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Twitch handle</label>
                          <input
                            type="text"
                            value={socialTwitchInput}
                            onChange={(e) => setSocialTwitchInput(e.target.value)}
                            placeholder="e.g. bob_streams"
                            style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>YouTube handle</label>
                          <input
                            type="text"
                            value={socialYoutubeInput}
                            onChange={(e) => setSocialYoutubeInput(e.target.value)}
                            placeholder="e.g. @bob_gaming"
                            style={{ width: '100%', background: '#090d16', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Choose Badges to Wear:</label>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {profileData.availableBadges?.map(badge => {
                            const active = selectedBadges.includes(badge);
                            return (
                              <button
                                type="button"
                                key={badge}
                                onClick={() => handleToggleBadgeSelection(badge)}
                                style={{
                                  background: active ? 'rgba(192, 132, 252, 0.15)' : '#090d16',
                                  border: `1px solid ${active ? '#c084fc' : 'rgba(255,255,255,0.08)'}`,
                                  color: active ? '#d8b4fe' : '#cbd5e1',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  cursor: 'pointer'
                                }}
                              >
                                {badge}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="submit"
                        style={{ background: '#c084fc', color: '#000000', border: 'none', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: '850', cursor: 'pointer', marginTop: '4px' }}
                      >
                        Save Card Customizations
                      </button>
                    </form>
                  </div>

                </div>

                {/* Right Column: Detailed core RPG Skills, Attributes, Achievements, and Social Portfolio */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Member stats cards row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
                      <span style={{ fontSize: '28px' }}>🍒</span>
                      <div>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Wallet Balance</span>
                        <strong style={{ fontSize: '14px', color: '#fbbf24' }}>🍒 {myCharacter.coins?.toLocaleString()}</strong>
                      </div>
                    </div>
                    
                    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
                      <span style={{ fontSize: '28px' }}>🐾</span>
                      <div>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Active Companion</span>
                        <strong style={{ fontSize: '13px', color: '#ffffff' }}>
                          {myCharacter.pet ? `${myCharacter.pet.name} (Lvl ${myCharacter.pet.level})` : 'No active companion'}
                        </strong>
                      </div>
                    </div>

                    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
                      <span style={{ fontSize: '28px' }}>🏡</span>
                      <div>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Homestead Plots</span>
                        <strong style={{ fontSize: '14px', color: '#ffffff' }}>{myCharacter.plots || 0} Crops</strong>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio section: Bio & Socials */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>📄 Adventurer Profile Portfolio</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Biographical Description:</span>
                        <p style={{ margin: '4px 0 0 0', color: '#cbd5e1', fontSize: '12.5px', lineHeight: '1.4', fontStyle: 'italic' }}>
                          "{bioInput || 'No biography written yet. Use the Customizer on the left to tell your story!'}"
                        </p>
                        
                        <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginTop: '12px' }}>Favorite Game Titles:</span>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {(favGamesInput || 'Cherry RPG').split(',').map((g, i) => (
                            <span key={i} style={{ fontSize: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', color: '#ffffff' }}>
                              🎮 {g.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '10px', color: '#c084fc', textTransform: 'uppercase', fontWeight: '800' }}>Social Handles:</span>
                        
                        <div style={{ fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>Discord:</span> <strong style={{ color: '#ffffff' }}>{socialDiscordInput || 'N/A'}</strong>
                        </div>
                        <div style={{ fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>Twitter/X:</span> <strong style={{ color: '#ffffff' }}>{socialTwitterInput || 'N/A'}</strong>
                        </div>
                        <div style={{ fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>Twitch:</span> <strong style={{ color: '#ffffff' }}>{socialTwitchInput || 'N/A'}</strong>
                        </div>
                        <div style={{ fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>YouTube:</span> <strong style={{ color: '#ffffff' }}>{socialYoutubeInput || 'N/A'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills levels */}
                  <div className="glass-card">
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800' }}>Your Core RPG Skills</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', textAlign: 'center' }}>
                      {Object.keys(myCharacter.skills).map(s => (
                        <div key={s} style={{ padding: '12px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <p style={{ margin: 0, fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>{s}</p>
                          <h5 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#a855f7' }}>Lvl {myCharacter.skills[s]}</h5>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attributes details */}
                  <div className="glass-card">
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800' }}>Adventurer Attributes & Stats</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                        <span style={{ color: '#f87171', fontSize: '12px', fontWeight: '750' }}>❤️ HP Pool:</span>
                        <span style={{ fontWeight: '850', color: '#ffffff' }}>{myCharacter.hp} / {myCharacter.maxHp}</span>
                      </div>
                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                        <span style={{ color: '#60a5fa', fontSize: '12px', fontWeight: '750' }}>💙 Mana Pool:</span>
                        <span style={{ fontWeight: '850', color: '#ffffff' }}>{myCharacter.mana} / {myCharacter.maxMana}</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', textAlign: 'center' }}>
                      {[
                        { label: 'STR 💪', val: myCharacter.stats?.strength || 10, color: '#f87171' },
                        { label: 'INT 🧠', val: myCharacter.stats?.intelligence || 10, color: '#60a5fa' },
                        { label: 'DEX 🏹', val: myCharacter.stats?.dexterity || 10, color: '#34d399' },
                        { label: 'DEF 🛡️', val: myCharacter.stats?.defense || 10, color: '#fbbf24' },
                        { label: 'LUC 🍀', val: myCharacter.stats?.luck || 10, color: '#a855f7' }
                      ].map(a => (
                        <div key={a.label} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: '750' }}>{a.label}</span>
                          <span style={{ fontSize: '15px', fontWeight: '850', color: a.color, display: 'block', marginTop: '4px' }}>{a.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Achievements Showcase */}
                  <div className="glass-card">
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800' }}>🏆 Unlocked RPG Medals Showcase</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      {[
                        { id: 'wealthy', emoji: '💰', title: 'Wealthy Merchant', desc: 'Acquire a wallet balance of 🍒 50,000+' },
                        { id: 'crop_master', emoji: '🌾', title: 'Grand Harvester', desc: 'Achieve level 3+ in Farming skill' },
                        { id: 'monster_slayer', emoji: '⚔️', title: 'Monster Slayer', desc: 'Reach level 3+ in Combat or Magic' },
                        { id: 'first_spin', emoji: '🎡', title: 'Lucky Spinner', desc: 'Spin the Wheel of Fortune once' }
                      ].map(medal => {
                        const isUnlocked = myCharacter.achievements?.includes(medal.id);
                        return (
                          <div 
                            key={medal.id} 
                            style={{ 
                              padding: '12px', 
                              borderRadius: '12px', 
                              background: isUnlocked ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.01)', 
                              border: `1px solid ${isUnlocked ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)'}`,
                              display: 'flex',
                              gap: '12px',
                              alignItems: 'center',
                              opacity: isUnlocked ? 1 : 0.4
                            }}
                          >
                            <span style={{ fontSize: '28px', filter: isUnlocked ? 'none' : 'grayscale(100%)' }}>{medal.emoji}</span>
                            <div>
                              <h5 style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: isUnlocked ? '#fbbf24' : '#94a3b8' }}>{medal.title}</h5>
                              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#cbd5e1' }}>{medal.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ADMIN CONSOLE */}
            {activeTab === 'admin' && loggedInUser && isAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>👑 Guild Admin Control Console</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Adjust player resources, audit transaction logs, and manage bot configurations</p>
                  </div>
                </div>

                <div className="grid-2">
                  {/* Balance editor form */}
                  <div className="glass-card">
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800', color: '#be185d' }}>💵 Adjust Player Cherries</h3>
                    <form onSubmit={handleModifyBalance} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Target User Discord ID</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="e.g. 1523312601805750462"
                          value={adminTargetUser}
                          onChange={(e) => setAdminTargetUser(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Action</label>
                          <select
                            className="admin-input"
                            value={adminAction}
                            onChange={(e) => setAdminAction(e.target.value)}
                          >
                            <option value="give">Give Cherries</option>
                            <option value="take">Take Cherries</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Amount</label>
                          <input
                            type="number"
                            className="admin-input"
                            value={adminAmount}
                            onChange={(e) => setAdminAmount(e.target.value)}
                          />
                        </div>
                      </div>
                      <button type="submit" style={{ marginTop: '12px', background: '#be185d', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '750', cursor: 'pointer' }}>
                        Apply Balance Modification
                      </button>
                    </form>
                  </div>

                  {/* Settings configurations */}
                  <div className="glass-card">
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800', color: '#a855f7' }}>⚙️ Welcome Notice System</h3>
                    <form onSubmit={handleSaveAdminSettings} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Welcome Message Template</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="Welcome {user} to {server}!"
                          value={adminSettings.welcomeMsg || ''}
                          onChange={(e) => setAdminSettings({ ...adminSettings, welcomeMsg: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Leave Message Template</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="Goodbye {user}!"
                          value={adminSettings.leaveMsg || ''}
                          onChange={(e) => setAdminSettings({ ...adminSettings, leaveMsg: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Auto-Assign Role on Join</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="Role name e.g. Gamer"
                          value={adminSettings.autoRole || ''}
                          onChange={(e) => setAdminSettings({ ...adminSettings, autoRole: e.target.value })}
                        />
                      </div>
                      <button type="submit" style={{ marginTop: '12px', background: '#a855f7', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '750', cursor: 'pointer' }}>
                        Save Welcome Settings
                      </button>
                    </form>
                  </div>
                </div>

                <div className="grid-2" style={{ marginTop: '24px' }}>
                  {/* Item Spawner */}
                  <div className="glass-card">
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800', color: '#10b981' }}>🎁 Admin Item Spawner</h3>
                    <form onSubmit={handleSpawnItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Target User Discord ID</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="e.g. 1523312601805750462"
                          value={adminTargetUser}
                          onChange={(e) => setAdminTargetUser(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Item Name</label>
                          <select
                            className="admin-input"
                            value={adminSpawnItem}
                            onChange={(e) => setAdminSpawnItem(e.target.value)}
                            style={{ width: '100%', boxSizing: 'border-box' }}
                          >
                            <option value="Iron Ore">Iron Ore 🪨</option>
                            <option value="Gold Ore">Gold Ore 🔱</option>
                            <option value="Diamond">Diamond 💎</option>
                            <option value="Coal">Coal 🖤</option>
                            <option value="Twig">Twig 🥢</option>
                            <option value="Seaweed">Seaweed 🌿</option>
                            <option value="Health Potion">Health Potion 🧪</option>
                            <option value="Mana Potion">Mana Potion 🌀</option>
                            <option value="Iron Sword">Iron Sword ⚔️</option>
                            <option value="Plated Shield">Plated Shield 🧱</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Quantity</label>
                          <input
                            type="number"
                            className="admin-input"
                            value={adminSpawnQty}
                            onChange={(e) => setAdminSpawnQty(Math.max(1, parseInt(e.target.value) || 1))}
                          />
                        </div>
                      </div>
                      <button type="submit" style={{ marginTop: '12px', background: '#10b981', color: '#000000', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '750', cursor: 'pointer' }}>
                        Spawn Item in Inventory
                      </button>
                    </form>
                  </div>

                  {/* Guild Notice Board Editor */}
                  <div className="glass-card">
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800', color: '#fbbf24' }}>📢 Notice Board Publisher</h3>
                    <form onSubmit={handlePublishAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Announcement Title</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="e.g. Server Maintenance Notice"
                          value={adminNoticeTitle}
                          onChange={(e) => setAdminNoticeTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Notice Body Content</label>
                        <textarea
                          className="admin-input"
                          placeholder="Write notice description here..."
                          rows={3}
                          value={adminNoticeContent}
                          onChange={(e) => setAdminNoticeContent(e.target.value)}
                          style={{ width: '100%', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        />
                      </div>
                      <button type="submit" style={{ marginTop: '12.5px', background: '#fbbf24', color: '#000000', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '750', cursor: 'pointer' }}>
                        Publish to Guild Notice Board
                      </button>
                    </form>
                  </div>
                </div>

                {/* Audit log list table */}
                <div className="glass-card">
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800' }}>📜 SQLite Audit Transaction Logs</h3>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>User ID</th>
                          <th>Action Type</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminLogs.map((l, idx) => (
                          <tr key={idx}>
                            <td style={{ color: '#94a3b8' }}>{new Date(l.timestamp).toLocaleString()}</td>
                            <td style={{ fontFamily: 'monospace' }}>{l.userId}</td>
                            <td style={{ color: '#fbbf24', fontWeight: '700' }}>{l.type}</td>
                            <td>{l.details}</td>
                          </tr>
                        ))}
                        {adminLogs.length === 0 && (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontStyle: 'italic' }}>
                              No audit logs loaded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Overlays / Modal detail popup for Player stats */}
            {selectedPlayer && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                <div className="glass-card" style={{ width: '550px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <button 
                    onClick={() => setSelectedPlayer(null)}
                    style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img src={selectedPlayer.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} style={{ width: '60px', height: '60px', borderRadius: '50%', border: '3px solid #8b5cf6' }} alt="" />
                    <div>
                      <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>{selectedPlayer.charName}</h2>
                      <p style={{ margin: 0, fontSize: '13px', color: '#c084fc' }}>Lvl {selectedPlayer.level} {selectedPlayer.race} {selectedPlayer.class}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Attributes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}><Heart size={14} style={{ color: '#ef4444' }} /> Attribute Bars</h4>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                        <span>HP</span>
                        <span>{selectedPlayer.hp} / {selectedPlayer.maxHp}</span>
                      </div>
                      <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${(selectedPlayer.hp / selectedPlayer.maxHp) * 100}%`, height: '100%', background: '#ef4444' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                        <span>Mana</span>
                        <span>{selectedPlayer.mana} / {selectedPlayer.maxMana}</span>
                      </div>
                      <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${(selectedPlayer.mana / selectedPlayer.maxMana) * 100}%`, height: '100%', background: '#3b82f6' }} />
                      </div>
                    </div>

                    {/* Equipment */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}><Sword size={14} style={{ color: '#a855f7' }} /> Equipment Slots</h4>
                      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '12px' }}>
                        <span style={{ color: '#64748b' }}>Weapon:</span>
                        <span style={{ fontWeight: '750', float: 'right', color: '#ffffff' }}>{selectedPlayer.weapon}</span>
                      </div>
                      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '12px' }}>
                        <span style={{ color: '#64748b' }}>Shield:</span>
                        <span style={{ fontWeight: '750', float: 'right', color: '#ffffff' }}>{selectedPlayer.shield}</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={14} style={{ color: '#fbbf24' }} /> Core Skill Levels</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'center' }}>
                      {Object.keys(selectedPlayer.skills).map(s => (
                        <div key={s} style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                          <p style={{ margin: 0, fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>{s}</p>
                          <h5 style={{ margin: '4px 0 0 0', fontSize: '15px', fontWeight: '800', color: '#fbbf24' }}>Lvl {selectedPlayer.skills[s]}</h5>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comrades */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                      <span style={{ fontSize: '20px' }}>🐾</span>
                      <div>
                        <span style={{ color: '#64748b' }}>Companion:</span>
                        <p style={{ margin: 0, fontWeight: '750', color: '#ffffff' }}>
                          {selectedPlayer.pet ? `${selectedPlayer.pet.name} (Lvl ${selectedPlayer.pet.level} ${selectedPlayer.pet.type})` : 'No pet adopted'}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                      <span style={{ fontSize: '20px' }}>🚜</span>
                      <div>
                        <span style={{ color: '#64748b' }}>Homestead Plots:</span>
                        <p style={{ margin: 0, fontWeight: '750', color: '#ffffff' }}>
                          {selectedPlayer.plots} plots active
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Spin results popup modal */}
            {spinResult && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
                <div className="glass-card glow-amber" style={{ width: '400px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', border: '2px solid #fbbf24' }}>
                  <span style={{ fontSize: '64px' }}>🎡</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }} className="text-gradient-gold">WHEEL OF FORTUNE</h2>
                    <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#cbd5e1' }}>The wheel finished spinning and landed on:</p>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed rgba(245,158,11,0.3)' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#fbbf24' }}>{spinResult}</h3>
                  </div>
                  <button 
                    onClick={() => setSpinResult(null)}
                    style={{ background: '#fbbf24', color: '#000000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Collect Rewards
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      </div>
    </div>
  );
}

export default App;
