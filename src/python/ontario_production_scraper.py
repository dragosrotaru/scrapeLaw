#!/usr/bin/env python3
"""
Production scraper for all Ontario cities with periodic saving and progress reporting.
"""

from final_scraper import OntarioLawyerScraper, ontarioCityList
import json
import time
import logging
from datetime import datetime
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ontario_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ProductionScraper:
    """Production scraper with periodic saving and progress tracking."""
    
    def __init__(self, save_interval=5):
        """
        Initialize production scraper.
        
        Args:
            save_interval: Save results every N cities
        """
        self.scraper = OntarioLawyerScraper()
        self.save_interval = save_interval
        self.results = []
        self.stats = {
            'total_cities': len(ontarioCityList),
            'cities_processed': 0,
            'cities_successful': 0,
            'cities_failed': 0,
            'total_lawyers': 0,
            'total_profiles_fetched': 0,
            'start_time': None,
            'last_save_time': None,
            'errors': []
        }
    
    def save_progress(self, force=False):
        """Save current progress to files."""
        if not force and len(self.results) % self.save_interval != 0:
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save main results
        results_file = f'ontario_lawyers_progress_{timestamp}.json'
        with open(results_file, 'w', encoding='utf-8') as f:
            # Clean results for saving
            clean_results = []
            for result in self.results:
                clean_result = result.copy()
                for lawyer in clean_result.get('lawyers', []):
                    lawyer.pop('raw_record', None)
                clean_results.append(clean_result)
            
            json.dump({
                'metadata': {
                    'generated_at': datetime.now().isoformat(),
                    'total_cities': len(clean_results),
                    'stats': self.stats
                },
                'results': clean_results
            }, f, indent=2, ensure_ascii=False)
        
        # Save summary statistics
        summary_file = f'ontario_summary_{timestamp}.json'
        with open(summary_file, 'w', encoding='utf-8') as f:
            # Create city summary
            city_summary = []
            for result in self.results:
                city_summary.append({
                    'city': result['city'],
                    'lawyers_found': result.get('processed', 0),
                    'profiles_fetched': result.get('profiles_fetched', 0),
                    'success_rate': f"{(result.get('profiles_fetched', 0) / max(result.get('processed', 1), 1) * 100):.1f}%",
                    'timestamp': result.get('timestamp', None)
                })
            
            json.dump({
                'summary': self.stats,
                'cities': city_summary,
                'top_cities_by_lawyers': sorted(city_summary, key=lambda x: x['lawyers_found'], reverse=True)[:10]
            }, f, indent=2, ensure_ascii=False)
        
        self.stats['last_save_time'] = datetime.now().isoformat()
        logger.info(f"✅ Progress saved to {results_file} and {summary_file}")
        logger.info(f"📊 Current stats: {self.stats['cities_processed']}/{self.stats['total_cities']} cities, {self.stats['total_lawyers']} lawyers, {self.stats['total_profiles_fetched']} profiles")
    
    def scrape_all_ontario_cities(self, fetch_profiles=True, max_profiles_per_city=None, start_from_city=None):
        """
        Scrape all Ontario cities with progress tracking.
        
        Args:
            fetch_profiles: Whether to fetch individual profiles
            max_profiles_per_city: Limit profiles per city (None for all)
            start_from_city: Resume from specific city (for crash recovery)
        """
        self.stats['start_time'] = datetime.now().isoformat()
        
        # Find starting index
        start_index = 0
        if start_from_city:
            try:
                start_index = ontarioCityList.index(start_from_city)
                logger.info(f"🔄 Resuming from city: {start_from_city} (index {start_index})")
            except ValueError:
                logger.warning(f"City {start_from_city} not found, starting from beginning")
        
        cities_to_process = ontarioCityList[start_index:]
        
        logger.info(f"🚀 Starting Ontario lawyer scraping")
        logger.info(f"📋 Total cities to process: {len(cities_to_process)}")
        logger.info(f"👤 Fetch profiles: {fetch_profiles}")
        if max_profiles_per_city:
            logger.info(f"📝 Max profiles per city: {max_profiles_per_city}")
        
        for i, city in enumerate(cities_to_process, start_index + 1):
            try:
                logger.info(f"\n{'='*60}")
                logger.info(f"🏙️  Processing city {i}/{self.stats['total_cities']}: {city}")
                logger.info(f"{'='*60}")
                
                # Update stats
                self.stats['cities_processed'] = i
                
                # Scrape the city
                if fetch_profiles:
                    result = self.scraper.scrape_city_with_profiles(
                        city, 
                        fetch_profiles=True, 
                        max_profiles=max_profiles_per_city
                    )
                else:
                    result = self.scraper.search_lawyers_by_city(city)
                
                if result:
                    self.results.append(result)
                    self.stats['cities_successful'] += 1
                    self.stats['total_lawyers'] += result.get('processed', 0)
                    self.stats['total_profiles_fetched'] += result.get('profiles_fetched', 0)
                    
                    # Log success
                    lawyers_count = result.get('processed', 0)
                    profiles_count = result.get('profiles_fetched', 0)
                    
                    if fetch_profiles:
                        logger.info(f"✅ {city}: {lawyers_count} lawyers, {profiles_count} profiles fetched")
                        if lawyers_count > 0:
                            success_rate = (profiles_count / lawyers_count) * 100
                            logger.info(f"📊 Profile success rate: {success_rate:.1f}%")
                    else:
                        logger.info(f"✅ {city}: {lawyers_count} lawyers found")
                else:
                    self.stats['cities_failed'] += 1
                    self.stats['errors'].append(f"{city}: Failed to scrape")
                    logger.error(f"❌ {city}: Failed to scrape")
                
                # Periodic save
                self.save_progress()
                
                # Progress report
                if i % 10 == 0:
                    elapsed = (datetime.now() - datetime.fromisoformat(self.stats['start_time'])).total_seconds()
                    avg_time_per_city = elapsed / i if i > 0 else 0
                    remaining_cities = self.stats['total_cities'] - i
                    estimated_remaining = (remaining_cities * avg_time_per_city) / 60  # minutes
                    
                    logger.info(f"\n📈 PROGRESS REPORT")
                    logger.info(f"   Cities processed: {i}/{self.stats['total_cities']} ({(i/self.stats['total_cities']*100):.1f}%)")
                    logger.info(f"   Success rate: {self.stats['cities_successful']}/{i} ({(self.stats['cities_successful']/i*100):.1f}%)")
                    logger.info(f"   Total lawyers: {self.stats['total_lawyers']}")
                    logger.info(f"   Total profiles: {self.stats['total_profiles_fetched']}")
                    logger.info(f"   Estimated remaining time: {estimated_remaining:.1f} minutes")
                
                # Be respectful with delays
                delay = 3 if fetch_profiles else 2
                if i < len(ontarioCityList):
                    logger.info(f"⏳ Waiting {delay} seconds before next city...")
                    time.sleep(delay)
                
            except KeyboardInterrupt:
                logger.info("\n🛑 Interrupted by user")
                self.save_progress(force=True)
                logger.info(f"💾 Progress saved before exit. Resume with start_from_city='{city}'")
                return self.results
                
            except Exception as e:
                self.stats['cities_failed'] += 1
                error_msg = f"{city}: {str(e)}"
                self.stats['errors'].append(error_msg)
                logger.error(f"❌ Error processing {city}: {e}")
                
                # Continue with next city
                continue
        
        # Final save
        self.save_progress(force=True)
        
        # Final report
        end_time = datetime.now()
        start_time = datetime.fromisoformat(self.stats['start_time'])
        total_duration = (end_time - start_time).total_seconds() / 60  # minutes
        
        logger.info(f"\n🎉 SCRAPING COMPLETED!")
        logger.info(f"⏱️  Total time: {total_duration:.1f} minutes")
        logger.info(f"🏙️  Cities processed: {self.stats['cities_processed']}")
        logger.info(f"✅ Successful: {self.stats['cities_successful']}")
        logger.info(f"❌ Failed: {self.stats['cities_failed']}")
        logger.info(f"👤 Total lawyers: {self.stats['total_lawyers']}")
        logger.info(f"📧 Total profiles: {self.stats['total_profiles_fetched']}")
        
        if self.stats['errors']:
            logger.info(f"\n⚠️  Errors encountered:")
            for error in self.stats['errors'][-10:]:  # Show last 10 errors
                logger.info(f"   {error}")
        
        return self.results

def main():
    """Main function to run the production scraper."""
    
    # Configuration
    FETCH_PROFILES = True  # Set to False for faster run without profiles
    MAX_PROFILES_PER_CITY = None  # Set to number to limit profiles per city, None for all
    START_FROM_CITY = None  # Set to city name to resume from specific city
    
    logger.info("🔥 ONTARIO LAWYER SCRAPER - PRODUCTION RUN")
    logger.info(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    scraper = ProductionScraper(save_interval=5)  # Save every 5 cities
    
    try:
        results = scraper.scrape_all_ontario_cities(
            fetch_profiles=FETCH_PROFILES,
            max_profiles_per_city=MAX_PROFILES_PER_CITY,
            start_from_city=START_FROM_CITY
        )
        
        logger.info("🏁 Production scraping completed successfully!")
        
    except Exception as e:
        logger.error(f"💥 Fatal error: {e}")
        scraper.save_progress(force=True)
        logger.info("💾 Emergency save completed")

if __name__ == "__main__":
    main()