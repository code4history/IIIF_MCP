#!/usr/bin/env node
type IIIFLabel = string | {
    [language: string]: string[];
};
interface IIIFAnnotation {
    "@context"?: string | string[];
    "@id"?: string;
    id?: string;
    "@type"?: string | string[];
    type?: string | string[];
    motivation?: string | string[];
    body?: IIIFAnnotationBody | IIIFAnnotationBody[];
    target?: string | IIIFAnnotationTarget;
    on?: string;
}
interface IIIFAnnotationBody {
    "@id"?: string;
    id?: string;
    "@type"?: string;
    type?: string;
    value?: string;
    format?: string;
    language?: string;
    chars?: string;
}
interface IIIFAnnotationTarget {
    "@id"?: string;
    id?: string;
    "@type"?: string;
    type?: string;
    selector?: {
        "@type"?: string;
        type?: string;
        value?: string;
        conformsTo?: string;
    };
}
interface IIIFAnnotationPage {
    "@context"?: string | string[];
    "@id"?: string;
    id?: string;
    "@type"?: string;
    type?: string;
    items?: IIIFAnnotation[];
    resources?: IIIFAnnotation[];
}
interface IIIFAnnotationList {
    "@context"?: string | string[];
    "@id"?: string;
    id?: string;
    "@type"?: string;
    type?: string;
    label?: IIIFLabel;
    resources?: IIIFAnnotation[];
    items?: IIIFAnnotation[] | IIIFAnnotationPage[];
    partOf?: {
        id?: string;
        type?: string;
        label?: IIIFLabel;
    };
}
interface IIIFCollectionItem {
    "@id"?: string;
    id?: string;
    "@type"?: string;
    type?: string;
    label?: IIIFLabel;
    viewingHint?: string;
    navDate?: string;
    thumbnail?: IIIFThumbnail | IIIFThumbnail[];
}
interface IIIFCollection {
    "@context"?: string | string[];
    "@id"?: string;
    id?: string;
    "@type"?: string;
    type?: string;
    label: IIIFLabel;
    description?: string | string[];
    summary?: IIIFLabel;
    metadata?: IIIFMetadata[];
    thumbnail?: IIIFThumbnail | IIIFThumbnail[];
    viewingDirection?: string;
    behavior?: string[];
    license?: string;
    rights?: string;
    attribution?: string;
    provider?: Array<{
        "@id"?: string;
        id?: string;
        "@type"?: string;
        type?: string;
        label?: IIIFLabel;
        homepage?: Array<{
            "@id"?: string;
            id?: string;
            "@type"?: string;
            type?: string;
            label?: IIIFLabel;
        }>;
    }>;
    collections?: IIIFCollectionItem[];
    manifests?: IIIFCollectionItem[];
    members?: IIIFCollectionItem[];
    items?: IIIFCollectionItem[];
    partOf?: Array<{
        id?: string;
        type?: string;
        label?: IIIFLabel;
    }>;
}
interface IIIFMetadataV2 {
    label: string;
    value: string | string[];
}
interface IIIFMetadataV3 {
    label: IIIFLabel;
    value: IIIFLabel;
}
type IIIFMetadata = IIIFMetadataV2 | IIIFMetadataV3;
interface IIIFThumbnail {
    "@id"?: string;
    id?: string;
    "@type"?: string;
    type?: string;
    format?: string;
    width?: number;
    height?: number;
}
interface IIIFCanvas {
    "@id"?: string;
    id?: string;
    "@type"?: string;
    type?: string;
    label?: IIIFLabel;
    width?: number;
    height?: number;
    thumbnail?: IIIFThumbnail[];
}
interface IIIFManifest {
    "@context"?: string | string[];
    "@id"?: string;
    id?: string;
    "@type"?: string;
    type?: string;
    label: IIIFLabel;
    description?: string | string[];
    summary?: IIIFLabel;
    metadata?: IIIFMetadata[];
    thumbnail?: IIIFThumbnail | IIIFThumbnail[];
    viewingDirection?: string;
    behavior?: string[];
    license?: string;
    rights?: string;
    attribution?: string;
    provider?: Array<{
        "@id"?: string;
        id?: string;
        "@type"?: string;
        type?: string;
        label?: IIIFLabel;
        homepage?: Array<{
            "@id"?: string;
            id?: string;
            "@type"?: string;
            type?: string;
            label?: IIIFLabel;
        }>;
    }>;
    sequences?: Array<{
        "@id"?: string;
        "@type"?: string;
        canvases?: IIIFCanvas[];
    }>;
    items?: IIIFCanvas[];
    structures?: Array<{
        "@id"?: string;
        id?: string;
        "@type"?: string;
        type?: string;
        label?: IIIFLabel;
        canvases?: string[];
        items?: Array<{
            id: string;
            type: string;
        }>;
    }>;
}
interface SearchResult {
    "@id": string;
    "@type": string;
    label?: string;
    hits?: Array<{
        "@type": string;
        annotations: string[];
        match?: string;
        before?: string;
        after?: string;
    }>;
}
interface SearchResponse {
    "@context": string;
    "@id": string;
    "@type": string;
    within?: {
        "@type": string;
        total: number;
    };
    hits: SearchResult[];
    resources?: SearchResult[];
}
interface StructuredSearchResult {
    url: string;
    service_url: string;
    query: string;
    total_results: number;
    api_version: string;
    results: Array<{
        id: string;
        type: string;
        label: string;
        matches?: Array<{
            text: string;
            context: string;
        }>;
    }>;
}
interface StructuredImageResult {
    url: string;
    base_url: string;
    parameters: {
        region: string;
        size: string;
        rotation: string;
        quality: string;
        format: string;
    };
    metadata: {
        suggested_filename: string;
        expected_dimensions?: string;
        original_id: string;
    };
}
interface StructuredImageInfo {
    id: string;
    type: string;
    protocol?: string;
    width: number;
    height: number;
    profile?: string | string[];
    sizes?: Array<{
        width: number;
        height: number;
    }>;
    tiles?: Array<{
        width: number;
        height?: number;
        scaleFactors?: number[];
    }>;
}
interface StructuredManifestResult {
    url: string;
    id: string;
    type: string;
    label: string;
    description?: string;
    thumbnail?: string;
    images: Array<{
        id: string;
        label: string;
        image_url?: string;
        width?: number;
        height?: number;
    }>;
    metadata?: Array<{
        label: string;
        value: string;
    }>;
    structures?: Array<{
        id: string;
        label: string;
        items: number;
    }>;
}
interface StructuredCollectionResult {
    url: string;
    id: string;
    type: string;
    label: string;
    description?: string;
    thumbnail?: string;
    total_items: number;
    collections: Array<{
        id: string;
        type: string;
        label: string;
        thumbnail?: string;
    }>;
    manifests: Array<{
        id: string;
        type: string;
        label: string;
        thumbnail?: string;
        navDate?: string;
    }>;
    metadata?: Array<{
        label: string;
        value: string;
    }>;
    partOf?: Array<{
        id: string;
        type?: string;
        label: string;
    }>;
}
interface StructuredAnnotationResult {
    url: string;
    total_annotations: number;
    languages: string[];
    motivations: string[];
    annotations: Array<{
        id: string;
        type: string;
        motivation: string[];
        text?: string;
        language?: string;
        format?: string;
        target: string;
        selector?: string;
    }>;
    text_content?: {
        full_text: string;
        by_language: {
            [lang: string]: string[];
        };
    };
}
interface IIIFActivity {
    "@context"?: string | string[];
    id: string;
    type: string;
    object?: {
        id: string;
        type: string;
        canonical?: string;
    };
    endTime?: string;
    startTime?: string;
    summary?: string;
}
interface IIIFActivityPage {
    "@context"?: string | string[];
    id: string;
    type: string;
    partOf?: {
        id: string;
        type: string;
    };
    startIndex?: number;
    next?: {
        id: string;
        type: string;
    };
    prev?: {
        id: string;
        type: string;
    };
    orderedItems: IIIFActivity[];
}
interface IIIFActivityCollection {
    "@context"?: string | string[];
    id: string;
    type: string;
    totalItems?: number;
    first?: {
        id: string;
        type: string;
    };
    last?: {
        id: string;
        type: string;
    };
}
interface StructuredActivityResult {
    url: string;
    type: string;
    page_info?: {
        current_page: string;
        next_page?: string;
        prev_page?: string;
        part_of?: string;
        start_index?: number;
    };
    total_activities?: number;
    activities: Array<{
        id: string;
        type: string;
        object_id: string;
        object_type: string;
        canonical_uri?: string;
        timestamp: string;
        summary?: string;
    }>;
}
interface IIIFMediaItem {
    "@id"?: string;
    id?: string;
    "@type"?: string;
    type?: string;
    format?: string;
    label?: IIIFLabel;
    duration?: number;
    width?: number;
    height?: number;
    body?: {
        id: string;
        type: string;
        format?: string;
        duration?: number;
        width?: number;
        height?: number;
    };
    content?: string;
}
interface StructuredAVResult {
    url: string;
    id: string;
    type: string;
    label: string;
    total_duration?: number;
    media_items: Array<{
        id: string;
        type: string;
        format: string;
        label?: string;
        duration?: number;
        dimensions?: {
            width: number;
            height: number;
        };
        canvas_id?: string;
        time_range?: {
            start: number;
            end: number;
        };
    }>;
    ranges?: Array<{
        id: string;
        label: string;
        start_time: number;
        end_time: number;
        items: string[];
    }>;
}
interface IIIFAuthService {
    "@context"?: string;
    "@id"?: string;
    id?: string;
    profile: string;
    label?: IIIFLabel;
    header?: IIIFLabel;
    description?: IIIFLabel;
    confirmLabel?: IIIFLabel;
    failureHeader?: IIIFLabel;
    failureDescription?: IIIFLabel;
    service?: IIIFAuthService[];
}
interface StructuredAuthInfo {
    resource_url: string;
    auth_api_version?: string;
    requires_auth: boolean;
    auth_services: Array<{
        id: string;
        type: string;
        profile: string;
        label?: string;
        header?: string;
        description?: string;
        confirm_label?: string;
        failure_header?: string;
        failure_description?: string;
    }>;
    login_services: Array<{
        id: string;
        label?: string;
        auth_api_version: string;
    }>;
    token_services: Array<{
        id: string;
        auth_api_version: string;
    }>;
    logout_services: Array<{
        id: string;
        label?: string;
        auth_api_version: string;
    }>;
    probe_services: Array<{
        id: string;
        auth_api_version: string;
    }>;
}
export declare class IIIFSearchClient {
    search(searchServiceUrl: string, query: string): Promise<SearchResponse>;
    formatSearchResults(response: SearchResponse): string;
    getStructuredResults(response: SearchResponse, serviceUrl: string, query: string): StructuredSearchResult;
}
export declare class IIIFImageClient {
    buildImageUrl(baseUrl: string, options?: {
        region?: string;
        size?: string;
        rotation?: string;
        quality?: string;
        format?: string;
    }): string;
    validateParameters(options: {
        region?: string;
        size?: string;
        rotation?: string;
        quality?: string;
        format?: string;
    }): {
        valid: boolean;
        errors: string[];
    };
    getImageInfo(infoUrl: string): Promise<any>;
    formatImageInfo(info: any): string;
    getStructuredImageUrl(baseUrl: string, options?: {
        region?: string;
        size?: string;
        rotation?: string;
        quality?: string;
        format?: string;
    }): StructuredImageResult;
    getStructuredImageInfo(info: any): StructuredImageInfo;
}
export declare class IIIFManifestClient {
    getManifest(manifestUrl: string): Promise<IIIFManifest>;
    private getFirstValue;
    private getMetadataValue;
    formatManifest(manifest: IIIFManifest, properties?: string[]): string;
    getStructuredManifest(manifest: IIIFManifest): StructuredManifestResult;
}
export declare class IIIFCollectionClient {
    getCollection(collectionUrl: string): Promise<IIIFCollection>;
    private getFirstValue;
    private getItemInfo;
    formatCollection(collection: IIIFCollection, includeItems?: boolean): string;
    getStructuredCollection(collection: IIIFCollection): StructuredCollectionResult;
}
export declare class IIIFAnnotationClient {
    getAnnotations(annotationUrl: string): Promise<IIIFAnnotationList | IIIFAnnotationPage>;
    private getFirstValue;
    private extractTextFromAnnotation;
    private getAnnotationTarget;
    formatAnnotations(annotationData: IIIFAnnotationList | IIIFAnnotationPage, options?: {
        includeNonText?: boolean;
        language?: string;
        groupByCanvas?: boolean;
    }): string;
    getStructuredAnnotations(annotationData: IIIFAnnotationList | IIIFAnnotationPage, options?: {
        includeNonText?: boolean;
        language?: string;
    }): StructuredAnnotationResult;
    getAnnotationsFromManifest(manifestUrl: string): Promise<string[]>;
}
export declare class IIIFActivityClient {
    getActivityStream(activityStreamUrl: string): Promise<IIIFActivityCollection | IIIFActivityPage>;
    getActivityPage(pageUrl: string): Promise<IIIFActivityPage>;
    processActivityStream(data: IIIFActivityCollection | IIIFActivityPage): string;
    getStructuredActivities(data: IIIFActivityCollection | IIIFActivityPage): StructuredActivityResult;
}
export declare class IIIFAVClient {
    getAVManifest(manifestUrl: string): Promise<IIIFManifest>;
    extractAVContent(manifest: IIIFManifest): IIIFMediaItem[];
    private isAVResource;
    formatAVContent(manifest: IIIFManifest, options?: {
        includeRanges?: boolean;
    }): string;
    getStructuredAVContent(manifest: IIIFManifest): StructuredAVResult;
    private extractTimeRange;
    private formatDuration;
    private getFirstValue;
}
interface AuthSession {
    resourceUrl: string;
    token?: string;
    cookie?: string;
    expiresAt?: Date;
    authType: 'cookie' | 'token' | 'external' | 'unknown';
}
export declare class IIIFAuthClient {
    private sessions;
    private cookieStore;
    getAuthInfo(resourceUrl: string): Promise<any>;
    private extractAuthFromError;
    extractAuthServices(resource: any): IIIFAuthService[];
    private extractAuthServicesFromCanvas;
    private isAuthService;
    formatAuthInfo(resource: any, authServices: IIIFAuthService[]): string;
    private formatAuthService;
    private getServiceType;
    getStructuredAuthInfo(resource: any, authServices: IIIFAuthService[]): StructuredAuthInfo;
    getFirstValue(label: IIIFLabel | undefined): string;
    /**
     * Authenticate with a IIIF resource using the appropriate auth flow
     * @param resourceUrl The protected resource URL
     * @param credentials Optional credentials for login
     * @param options Optional authentication options
     * @returns The authenticated session or throws error
     */
    authenticate(resourceUrl: string, credentials?: {
        username: string;
        password: string;
    }, options?: {
        token?: string;
        sessionId?: string;
        interactive?: boolean;
    }): Promise<AuthSession>;
    /**
     * Perform cookie-based authentication
     */
    private performCookieAuth;
    /**
     * Perform token-based authentication
     */
    private performTokenAuth;
    /**
     * Perform external authentication
     */
    private performExternalAuth;
    /**
     * Find an available port
     */
    private findAvailablePort;
    /**
     * Check if a port is available
     */
    private isPortAvailable;
    /**
     * Get token from IIIF token service
     * In a browser environment, this would use iframe/postMessage.
     * In Node.js, we make a direct HTTP request with cookies.
     */
    private getTokenFromService;
    /**
     * Make an authenticated request to a protected resource
     */
    getProtectedResource(resourceUrl: string, session?: AuthSession): Promise<any>;
    /**
     * Probe access to a resource
     */
    probeAccess(resourceUrl: string, session?: AuthSession): Promise<boolean>;
    /**
     * Logout from a resource
     */
    logout(resourceUrl: string): Promise<void>;
    /**
     * Check if a session is still valid
     */
    private isSessionValid;
    /**
     * Determine authentication type from profile
     */
    private determineAuthType;
}
export {};
//# sourceMappingURL=index.d.ts.map