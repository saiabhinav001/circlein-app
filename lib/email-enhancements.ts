/**
 * ENHANCED EMAIL TEMPLATE COMPONENTS
 * Reusable HTML components for manager contact, directions, weather, and recommendations
 */

interface AmenityDetails {
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  latitude?: number;
  longitude?: number;
  buildingName?: string;
  floorNumber?: string;
  directions?: string;
}

/**
 * Generate manager contact info section for emails
 */
export function generateManagerContactHTML(manager?: {
  name?: string;
  phone?: string;
  email?: string;
}): string {
  if (!manager || (!manager.name && !manager.phone && !manager.email)) {
    return '';
  }

  return `
    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; padding: 25px; border-radius: 12px; margin: 25px 0;">
      <h3 style="color: #1e40af; font-size: 18px; font-weight: 700; margin-bottom: 15px;">
        👤 Amenity Manager
      </h3>
      <div style="color: #1e3a8a; font-size: 15px; line-height: 1.8;">
        ${manager.name ? `
          <div style="margin-bottom: 10px;">
            <strong style="color: #1e40af;">Name:</strong> ${manager.name}
          </div>
        ` : ''}
        ${manager.phone ? `
          <div style="margin-bottom: 10px;">
            <strong style="color: #1e40af;">Phone:</strong> 
            <a href="tel:${manager.phone}" style="color: #2563eb; text-decoration: none; font-weight: 600;">
              ${manager.phone}
            </a>
          </div>
        ` : ''}
        ${manager.email ? `
          <div style="margin-bottom: 10px;">
            <strong style="color: #1e40af;">Email:</strong> 
            <a href="mailto:${manager.email}" style="color: #2563eb; text-decoration: none; font-weight: 600;">
              ${manager.email}
            </a>
          </div>
        ` : ''}
        <div style="margin-top: 15px; padding: 12px; background: white; border-radius: 8px; border: 1px solid #93c5fd;">
          <span style="font-size: 14px; color: #1e40af;">
            💬 Need assistance? Feel free to reach out to the amenity manager for any questions or special requirements.
          </span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate directions and map link section for emails
 */
export function generateDirectionsHTML(amenity: AmenityDetails): string {
  const hasLocation = amenity.latitude && amenity.longitude;
  const hasDetails = amenity.buildingName || amenity.floorNumber || amenity.directions;

  if (!hasLocation && !hasDetails) {
    return '';
  }

  const googleMapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${amenity.latitude},${amenity.longitude}`
    : '';

  return `
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 25px; border-radius: 12px; margin: 25px 0;">
      <h3 style="color: #92400e; font-size: 18px; font-weight: 700; margin-bottom: 15px;">
        📍 Location & Directions
      </h3>
      <div style="color: #78350f; font-size: 15px; line-height: 1.8;">
        ${amenity.buildingName ? `
          <div style="margin-bottom: 10px;">
            <strong style="color: #92400e;">Building:</strong> ${amenity.buildingName}
          </div>
        ` : ''}
        ${amenity.floorNumber ? `
          <div style="margin-bottom: 10px;">
            <strong style="color: #92400e;">Floor:</strong> ${amenity.floorNumber}
          </div>
        ` : ''}
        ${amenity.directions ? `
          <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #fcd34d;">
            <strong style="color: #92400e;">How to get there:</strong><br/>
            <span style="color: #78350f; line-height: 1.6;">${amenity.directions}</span>
          </div>
        ` : ''}
        ${hasLocation ? `
          <div style="margin-top: 15px; text-align: center;">
            <a href="${googleMapsUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.4);">
              🗺️ Open in Google Maps
            </a>
          </div>
          <div style="margin-top: 10px; text-align: center;">
            <span style="font-size: 12px; color: #92400e; font-style: italic;">
              Click to get turn-by-turn navigation
            </span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Generate complete enhanced email section
 * Combines manager contact, directions, weather, and recommendations
 */
export function generateEnhancedEmailSections(options: {
  manager?: { name?: string; phone?: string; email?: string };
  amenityDetails?: AmenityDetails;
  weatherHTML?: string;
  recommendationsHTML?: string;
}): string {
  const sections: string[] = [];

  // Add manager contact
  if (options.manager) {
    const managerHTML = generateManagerContactHTML(options.manager);
    if (managerHTML) sections.push(managerHTML);
  }

  // Add directions
  if (options.amenityDetails) {
    const directionsHTML = generateDirectionsHTML(options.amenityDetails);
    if (directionsHTML) sections.push(directionsHTML);
  }

  // Add weather (already formatted HTML)
  if (options.weatherHTML) {
    sections.push(options.weatherHTML);
  }

  // Add recommendations (already formatted HTML)
  if (options.recommendationsHTML) {
    sections.push(options.recommendationsHTML);
  }

  return sections.join('\n');
}

/**
 * Example usage in booking confirmation email:
 * 
 * const enhancedSections = generateEnhancedEmailSections({
 *   manager: {
 *     name: 'John Smith',
 *     phone: '+1-555-123-4567',
 *     email: 'john.smith@community.com'
 *   },
 *   amenityDetails: {
 *     buildingName: 'Tower A',
 *     floorNumber: '2nd Floor',
 *     directions: 'Take the main elevator to the 2nd floor, turn left and walk to the end of the hallway',
 *     latitude: 40.7128,
 *     longitude: -74.0060
 *   },
 *   weatherHTML: await generateWeatherHTML(weather), // from weather-service.ts
 *   recommendationsHTML: generateRecommendationsHTML(recommendations) // from amenity-recommendations.ts
 * });
 * 
 * // Insert enhancedSections into your email HTML before the footer
 */
