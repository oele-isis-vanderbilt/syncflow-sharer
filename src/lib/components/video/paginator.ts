export class Paginator<T> {
	items: T[];
	pageSize: number;
	currentPage: number;

	constructor(items: T[], pageSize: number) {
		this.items = items;
		this.pageSize = pageSize;
		this.currentPage = 0;
	}

	get totalPages(): number {
		return Math.ceil(this.items.length / this.pageSize);
	}

	get currentItems(): T[] {
		const start = this.currentPage * this.pageSize;
		const end = start + this.pageSize;
		return this.items.slice(start, end);
	}

	nextPage(): void {
		if (this.currentPage < this.totalPages - 1) {
			this.currentPage++;
		}
	}

	previousPage(): void {
		if (this.currentPage > 0) {
			this.currentPage--;
		}
	}

	goToPage(page: number): void {
		if (page >= 0 && page < this.totalPages) {
			this.currentPage = page;
		}
	}

	reset(): void {
		this.currentPage = 0;
	}

	getFlowBitePages(): { name: number; active: boolean }[] {
		const pagesToShow = 5;

		if (this.totalPages <= pagesToShow) {
			return Array.from({ length: this.totalPages }, (_, i) => ({
				name: i + 1,
				active: i === this.currentPage
			}));
		}

		const start = Math.max(0, this.currentPage - Math.floor(pagesToShow / 2));
		const end = Math.min(this.totalPages, start + pagesToShow);
		const pages = Array.from({ length: end - start }, (_, i) => ({
			name: start + i + 1,
			active: start + i === this.currentPage
		}));

		return pages;
	}

	updateItems(newItems: T[]): void {
		this.items = newItems;
		this.reset();
	}
}
