function filterTransactions(list, type = 'all', from = null, to = null) {
    return list.filter(t => {
      const matchType = type === 'all' || t.type === type;
      const matchDate =
        (!from || new Date(t.date) >= new Date(from)) &&
        (!to || new Date(t.date) <= new Date(to));
      return matchType && matchDate;
    });
  }
  