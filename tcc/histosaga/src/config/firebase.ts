import { initializeApp } from "firebase/app";
import { enableIndexedDbPersistence, getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

enableIndexedDbPersistence(db).catch((err) => {

    if (err.code === 'failed-precondition') {
        console.warn('Persistência offline já ativada em outra aba');
    } else if (err.code === 'unimplemented') {
        console.warn('Persistência offline não suportada');
    }

});

const OFFLINE_ACTIVITIES_KEY = '@offline_activities';

export const saveActivityOffline = async (activityId: string, data: any) => {
  
    try {
       
        const existingData = await AsyncStorage.getItem(OFFLINE_ACTIVITIES_KEY);
        const activities = existingData ? JSON.parse(existingData) : {};
        activities[activityId] = {...data, lastUpdated: new Date().toISOString(), isOffline: true};
       
        await AsyncStorage.setItem(OFFLINE_ACTIVITIES_KEY, JSON.stringify(activities));

    } catch (error) {
        console.error('Erro ao salvar atividade. ', error);
    }
};

export const getOfflineActivity = async (activityId: string) => {

    try { 
        
        const activitiesData = await AsyncStorage.getItem(OFFLINE_ACTIVITIES_KEY);
        const activities = activitiesData ? JSON.parse(activitiesData) : {};
       
        return activities[activityId] || null;
   
    } catch (error) {
        console.error('Erro ao carregar atividade. ', error);
        return null;
    }
};

export const clearOfflineActivity = async (activityId: string) => {
  
    try {

        const activitiesData = await AsyncStorage.getItem(OFFLINE_ACTIVITIES_KEY);
        const activities = activitiesData ? JSON.parse(activitiesData) : {};
       
        delete activities[activityId];
        await AsyncStorage.setItem(OFFLINE_ACTIVITIES_KEY, JSON.stringify(activities));
  
    } catch (error) {
        console.error('Erro ao limpar atividade. ', error);
    }
};