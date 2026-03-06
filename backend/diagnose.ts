
import { ClothingItemModel } from './src/models/ClothingItemModel';
import { SavedOutfitModel } from './src/models/SavedOutfitModel';
import { AnalysisResultModel } from './src/models/AnalysisResultModel';
import { BodyProfileModel } from './src/models/BodyProfileModel';

async function runDiagnostics() {
    const userId = '81ac09c9-ee9f-4d5f-a42d-0d188950c54f'; // From logs

    console.log('--- 诊断开始 ---');

    try {
        console.log('1. 测试 ClothingItemModel.findByUserId...');
        const items: any[] = await ClothingItemModel.findByUserId(userId, { includeArchived: true });
        console.log(`   结果: 找到 ${items.length} 件单品`);
        if (items.length > 0) {
            console.log('   样板单品 imageFront:', items[0].imageFront);
            console.log('   样板单品 isArchived:', items[0].isArchived);
        }

        console.log('2. 测试 SavedOutfitModel.findByUserId...');
        const outfits: any[] = await SavedOutfitModel.findByUserId(userId);
        console.log(`   结果: 找到 ${outfits.length} 个搭配`);

        console.log('3. 测试 BodyProfileModel.findByUserId...');
        const profile: any = await BodyProfileModel.findByUserId(userId);
        console.log(`   结果: ${profile ? '找到档案' : '未找到档案'}`);

        console.log('4. 测试 AnalysisResultModel.findLatestByUserId...');
        const analysis: any = await AnalysisResultModel.findLatestByUserId(userId);
        console.log(`   结果: ${analysis ? '找到分析结果' : '未找到分析结果'}`);

    } catch (err: any) {
        console.error('!!! 诊断过程中发生错误 !!!');
        console.error(err);
    } finally {
        console.log('--- 诊断结束 ---');
        process.exit(0);
    }
}

runDiagnostics();
